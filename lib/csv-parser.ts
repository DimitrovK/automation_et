/**
 * CSV Parser Utility
 * Handles parsing and validation of CSV files for questions
 */

import type { ParsedQuestion, ParseResult } from '@/types/csv';

// Re-export types for backward compatibility
export type { ParsedQuestion, ParseResult };

/**
 * Parse a single CSV line handling quoted strings with commas
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Parse CSV file and return structured data
 */
export function parseCSV(text: string): ParseResult {
  const lines = text.split('\n').filter(line => line.trim());

  if (lines.length < 2) {
    return {
      success: false,
      data: [],
      error: 'CSV file appears to be empty or invalid',
    };
  }

  // Parse headers
  const headers = parseCSVLine(lines[0]);

  // Validate required columns based on your CSV format
  const requiredColumns = ['Questions', 'Difficulty', 'A', 'B', 'C', 'D', 'Correct answer', 'Country'];
  const missingColumns = requiredColumns.filter(col => !headers.includes(col));

  if (missingColumns.length > 0) {
    return {
      success: false,
      data: [],
      error: `Missing required columns: ${missingColumns.join(', ')}`,
    };
  }

  // Parse data rows
  const dataRows: ParsedQuestion[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: any = { row: i + 1 };

    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    dataRows.push(row);
  }

  return {
    success: true,
    data: dataRows,
    totalRows: lines.length - 1,
  };
}

/**
 * Get preview of first N rows
 */
export function getPreviewRows(data: ParsedQuestion[], count: number = 5): ParsedQuestion[] {
  return data.slice(0, count);
}

/**
 * Validate CSV file
 */
export function validateCSVFile(file: File): { valid: boolean; error?: string } {
  if (!file.name.endsWith('.csv')) {
    return { valid: false, error: 'Please select a CSV file' };
  }

  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { valid: false, error: 'File size exceeds 10MB limit' };
  }

  return { valid: true };
}
