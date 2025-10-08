import { apiFetcher } from "@/lib/api-fetcher"
import type { Category, CategoryListResponse, CategoryQueryParams } from "@/types/category"

/**
 * Category API functions
 */

/**
 * Get all categories with optional filtering
 */
export async function getCategories(params?: CategoryQueryParams): Promise<CategoryListResponse> {
  const queryParams = new URLSearchParams()
  
  if (params?.id !== undefined) {
    queryParams.append("id", params.id.toString())
  }
  if (params?.name) {
    queryParams.append("name", params.name)
  }
  if (params?.page !== undefined) {
    queryParams.append("page", params.page.toString())
  }

  const queryString = queryParams.toString()
  const endpoint = `category/categories/${queryString ? `?${queryString}` : ""}`

  return apiFetcher(endpoint, {
    method: "GET",
  })
}

/**
 * Get a single category by ID
 */
export async function getCategoryById(id: number): Promise<Category> {
  const response = await getCategories({ id })
  
  if (response.results.length === 0) {
    throw new Error(`Category with ID ${id} not found`)
  }
  
  return response.results[0]
}

/**
 * Search categories by name
 */
export async function searchCategoriesByName(name: string, page?: number): Promise<CategoryListResponse> {
  return getCategories({ name, page })
}
