export interface Category {
  id: number
  name: string
  status: "APPROVED" | "PENDING" | "REJECTED"
}

export interface CategoryListResponse {
  count: number
  next: string | null
  previous: string | null
  results: Category[]
}

export interface CategoryQueryParams {
  id?: number
  name?: string
  page?: number
}
