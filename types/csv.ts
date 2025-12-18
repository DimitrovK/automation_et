/**
 * CSV Parser Types
 */

export type ParsedQuestion = {
  row: number;
  [key: string]: any;
};

export type ParseResult = {
  success: boolean;
  data: ParsedQuestion[];
  error?: string;
  totalRows?: number;
};
