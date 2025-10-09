/**
 * CSV Parser Types
 */

export interface ParsedQuestion {
  row: number
  [key: string]: any
}

export interface ParseResult {
  success: boolean
  data: ParsedQuestion[]
  error?: string
  totalRows?: number
}
