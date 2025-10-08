/**
 * Questions API service using api-fetcher
 * Follows the same pattern as FootballerAPI
 */

import { apiFetcher } from "@/lib/api-fetcher"
import { parseCSV, type ParsedQuestion } from "@/lib/csv-parser"

// Types
export interface Question {
  id?: number
  status: string
  text: string
  difficulty: string
  answer1: string
  answer2: string
  answer3: string
  answer4: string
  correct_answer: number
  categories: number[]
  might_change: boolean
}

export interface QuestionsResponse {
  count: number
  next: string | null
  previous: string | null
  results: Question[]
}

export interface Category {
  id: number
  name: string
}

export interface CategoriesResponse {
  count: number
  next: string | null
  previous: string | null
  results: Category[]
}

export interface QuestionDetail {
  row: number
  text: string
  difficulty: string
  categories: string[]
}

export interface UploadQuestionsResponse {
  success: boolean
  total: number
  successful: number
  failed: number
  skipped: number
  duplicates: number
  errors: string[]
  message: string
  uploadedQuestions?: QuestionDetail[]
  duplicateQuestions?: QuestionDetail[]
  skippedQuestions?: QuestionDetail[]
  failedQuestions?: QuestionDetail[]
}

/**
 * API service for Django questions endpoints
 */
export class QuestionsAPI {
  /**
   * Get questions with optional search
   * GET /quiz/questions/?search={text}
   */
  static async getQuestions(searchText?: string): Promise<QuestionsResponse> {
    const url = searchText 
      ? `quiz/questions/?search=${encodeURIComponent(searchText)}`
      : 'quiz/questions/'
    
    console.log('🔍 API Call: GET', url)
    const result = await apiFetcher(url)
    console.log('✅ API Response: GET', url, '- Results:', result.results?.length || 0)
    return result
  }

  /**
   * Create a new question
   * POST /quiz/questions/
   */
  static async createQuestion(data: Omit<Question, 'id'>): Promise<Question> {
    console.log('📤 API Call: POST quiz/questions/', {
      text: data.text.substring(0, 50) + '...',
      difficulty: data.difficulty,
      categories: data.categories,
      status: data.status
    })
    
    const result = await apiFetcher('quiz/questions/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    
    console.log('✅ API Response: POST quiz/questions/ - Created question ID:', result.id)
    return result
  }

  /**
   * Get categories with optional name filter
   * GET /category/categories/?name={name}
   */
  static async getCategories(name?: string): Promise<CategoriesResponse> {
    const url = name 
      ? `category/categories/?name=${encodeURIComponent(name)}`
      : 'category/categories/'
    
    console.log('🔍 API Call: GET', url)
    const result = await apiFetcher(url)
    console.log('✅ API Response: GET', url, '- Results:', result.results?.length || 0)
    return result
  }

  /**
   * Get category ID by name
   */
  static async getCategoryIdByName(categoryName: string): Promise<number | null> {
    try {
      console.log(`🔎 Looking up category: "${categoryName}"`)
      const data = await this.getCategories(categoryName)
      
      if (data.results && data.results.length > 0) {
        console.log(`✅ Found category "${categoryName}" with ID:`, data.results[0].id)
        return data.results[0].id
      }
      
      console.log(`❌ Category "${categoryName}" not found`)
      return null
    } catch (error) {
      console.error(`❌ Error fetching category "${categoryName}":`, error)
      return null
    }
  }

  /**
   * Check if a question already exists using text similarity
   */
  static async checkQuestionExists(questionText: string): Promise<boolean> {
    try {
      const searchText = questionText.substring(0, 50)
      console.log(`🔍 Checking for duplicate question: "${searchText}..."`)
      
      const data = await this.getQuestions(searchText)
      
      if (data.results && Array.isArray(data.results)) {
        for (const existingQuestion of data.results) {
          const similarity = this.calculateSimilarity(questionText, existingQuestion.text)
          if (similarity > 0.9) {
            console.log(`⚠️  Duplicate found! Similarity: ${(similarity * 100).toFixed(1)}%`)
            return true
          }
        }
      }
      
      console.log(`✅ No duplicate found`)
      return false
    } catch (error) {
      console.error('❌ Error checking question existence:', error)
      return false
    }
  }

  /**
   * Calculate text similarity using Levenshtein distance
   */
  private static calculateSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim()
    const s2 = str2.toLowerCase().trim()
    
    if (s1 === s2) return 1.0
    if (s1.length === 0 || s2.length === 0) return 0.0
    
    const matrix: number[][] = []
    
    for (let i = 0; i <= s2.length; i++) {
      matrix[i] = [i]
    }
    
    for (let j = 0; j <= s1.length; j++) {
      matrix[0][j] = j
    }
    
    for (let i = 1; i <= s2.length; i++) {
      for (let j = 1; j <= s1.length; j++) {
        if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }
    
    const maxLength = Math.max(s1.length, s2.length)
    const distance = matrix[s2.length][s1.length]
    
    return 1 - (distance / maxLength)
  }

  /**
   * Map difficulty from CSV to API format
   */
  private static mapDifficulty(difficulty: string): string {
    const difficultyMap: { [key: string]: string } = {
      'Easy': 'EASY',
      'Normal': 'NORMAL',
      'Hard': 'HARD',
      'Expert': 'EXTREME'
    }
    return difficultyMap[difficulty] || 'NORMAL'
  }

  /**
   * Map correct answer letter to number
   */
  private static mapCorrectAnswer(letter: string): number {
    const answerMap: { [key: string]: number } = {
      'A': 1,
      'B': 2,
      'C': 3,
      'D': 4
    }
    return answerMap[letter.toUpperCase()] || 1
  }

  /**
   * Upload questions from CSV file
   * Processes each question: validates, checks for duplicates, and uploads
   */
  static async uploadQuestionsFromCSV(file: File): Promise<UploadQuestionsResponse> {
    console.log('📂 Starting CSV upload:', file.name, `(${(file.size / 1024).toFixed(2)} KB)`)
    
    const results = {
      total: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      duplicates: 0,
      errors: [] as string[],
      uploadedQuestions: [] as QuestionDetail[],
      duplicateQuestions: [] as QuestionDetail[],
      skippedQuestions: [] as QuestionDetail[],
      failedQuestions: [] as QuestionDetail[]
    }

    try {
      // Read and parse CSV
      console.log('📄 Reading and parsing CSV file...')
      const text = await file.text()
      const parseResult = parseCSV(text)
      
      if (!parseResult.success) {
        throw new Error(parseResult.error || 'Failed to parse CSV')
      }

      const questions = parseResult.data
      console.log(`📊 Parsed ${questions.length} questions from CSV`)

      // Process each question
      for (const question of questions) {
        const rowNum = question.row
        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
        console.log(`📝 Processing Row ${rowNum}`)
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
        
        // Validate required fields
        if (!question.Questions) {
          console.log(`❌ Row ${rowNum}: Missing question text - SKIPPED`)
          results.skipped++
          results.errors.push(`Row ${rowNum}: Missing question text`)
          results.skippedQuestions.push({
            row: rowNum,
            text: "(Missing question text)",
            difficulty: question.Difficulty || 'N/A',
            categories: []
          })
          continue
        }

        console.log(`Question: "${question.Questions.substring(0, 60)}..."`)
        results.total++

        // Check if question already exists
        const exists = await this.checkQuestionExists(question.Questions)
        if (exists) {
          console.log(`⚠️  Row ${rowNum}: Duplicate detected - SKIPPED`)
          results.duplicates++
          results.errors.push(`Row ${rowNum}: Question already exists (duplicate skipped)`)
          results.duplicateQuestions.push({
            row: rowNum,
            text: question.Questions,
            difficulty: question.Difficulty || 'N/A',
            categories: [question.Country, question.Player, question.Team].filter(Boolean)
          })
          continue
        }

        // Collect all categories from Country, Player, and Team fields
        console.log(`📋 Extracting categories from CSV columns...`)
        console.log(`   Country: "${question.Country || '(empty)'}"`)
        console.log(`   Player: "${question.Player || '(empty)'}"`)
        console.log(`   Team: "${question.Team || '(empty)'}"`)
        
        const categoryNames = [
          question.Country?.trim(),
          question.Player?.trim(),
          question.Team?.trim()
        ].filter(name => name && name.length > 0) // Remove empty values

        console.log(`🏷️  Found ${categoryNames.length} category names:`, categoryNames)

        if (categoryNames.length === 0) {
          console.log(`❌ Row ${rowNum}: No categories provided - SKIPPED`)
          results.skipped++
          results.errors.push(`Row ${rowNum}: No categories provided (Country, Player, or Team)`)
          results.skippedQuestions.push({
            row: rowNum,
            text: question.Questions,
            difficulty: question.Difficulty || 'N/A',
            categories: []
          })
          continue
        }

        // Get category IDs for all provided categories
        const categoryIds: number[] = []
        const notFoundCategories: string[] = []

        for (const categoryName of categoryNames) {
          const categoryId = await this.getCategoryIdByName(categoryName)
          if (categoryId) {
            categoryIds.push(categoryId)
          } else {
            notFoundCategories.push(categoryName)
          }
        }

        console.log(`📊 Category lookup results:`)
        console.log(`   ✅ Found: ${categoryIds.length} categories - IDs: [${categoryIds.join(', ')}]`)
        if (notFoundCategories.length > 0) {
          console.log(`   ❌ Not found: ${notFoundCategories.length} categories - [${notFoundCategories.join(', ')}]`)
        }

        // If any categories were not found, skip the question
        if (notFoundCategories.length > 0) {
          console.log(`❌ Row ${rowNum}: Categories not found - SKIPPED`)
          results.skipped++
          results.errors.push(`Row ${rowNum}: Categories not found: ${notFoundCategories.join(', ')} (question skipped)`)
          results.skippedQuestions.push({
            row: rowNum,
            text: question.Questions,
            difficulty: question.Difficulty || 'N/A',
            categories: notFoundCategories
          })
          continue
        }

        // If no categories were found at all, skip the question
        if (categoryIds.length === 0) {
          console.log(`❌ Row ${rowNum}: No valid categories found - SKIPPED`)
          results.skipped++
          results.errors.push(`Row ${rowNum}: None of the categories found: ${notFoundCategories.join(', ')}`)
          results.skippedQuestions.push({
            row: rowNum,
            text: question.Questions,
            difficulty: question.Difficulty || 'N/A',
            categories: []
          })
          continue
        }

        // Upload question
        try {
          const questionData: Omit<Question, 'id'> = {
            status: "AWAITING_REVISION",
            text: question.Questions,
            difficulty: this.mapDifficulty(question.Difficulty),
            answer1: question.A,
            answer2: question.B,
            answer3: question.C,
            answer4: question.D,
            correct_answer: this.mapCorrectAnswer(question['Correct answer']),
            categories: categoryIds, // Array of all found category IDs
            might_change: false
          }

          console.log(`📤 Uploading question with ${categoryIds.length} categories...`)
          await this.createQuestion(questionData)
          console.log(`✅ Row ${rowNum}: Successfully uploaded!`)
          results.successful++
          results.uploadedQuestions.push({
            row: rowNum,
            text: question.Questions,
            difficulty: question.Difficulty || 'N/A',
            categories: categoryNames
          })
        } catch (error) {
          console.log(`❌ Row ${rowNum}: Upload failed -`, error)
          results.failed++
          results.errors.push(`Row ${rowNum}: Failed to upload - ${error instanceof Error ? error.message : 'Unknown error'}`)
          results.failedQuestions.push({
            row: rowNum,
            text: question.Questions,
            difficulty: question.Difficulty || 'N/A',
            categories: categoryNames
          })
        }
      }

      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
      console.log(`📊 Upload Summary`)
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
      console.log(`Total processed: ${results.total}`)
      console.log(`✅ Successful: ${results.successful}`)
      console.log(`⚠️  Duplicates: ${results.duplicates}`)
      console.log(`❌ Failed: ${results.failed}`)
      console.log(`⏭️  Skipped: ${results.skipped}`)
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)

      return {
        success: true,
        ...results,
        message: `Processed ${results.total} questions: ${results.successful} uploaded, ${results.duplicates} duplicates skipped, ${results.failed} failed, ${results.skipped} skipped`
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to upload questions')
    }
  }
}
