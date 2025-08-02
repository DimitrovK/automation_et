import config from "@/lib/config"

interface ApiOptions extends RequestInit {
  headers?: Record<string, string>
}

/**
 * API fetcher with automatic JWT token handling and refresh
 */
export async function apiFetcher(url: string, options: ApiOptions = {}): Promise<any> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null

  async function executeRequest(): Promise<Response> {
    return fetch(config.getApiUrl(url), {
      ...options,
      headers: {
        ...(options.headers || {}),
        ...(url.startsWith("auth/") || !token
          ? {}
          : { Authorization: `Bearer ${token}` }),
        "Content-Type": "application/json",
      },
    })
  }

  let response = await executeRequest()

  // Handle token refresh on 401 unauthorized
  if (response.status === 401 && token && refreshToken) {
    try {
      const refreshResponse = await fetch(config.getApiUrl("auth/token/refresh/"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      })

      if (refreshResponse.ok) {
        const { access } = await refreshResponse.json()
        localStorage.setItem("token", access)
        
        // Retry the original request with new token
        response = await executeRequest()
      } else {
        // Refresh failed, clear tokens and throw error
        localStorage.removeItem("token")
        localStorage.removeItem("refresh_token")
        throw new Error("Session expired. Please log in again.")
      }
    } catch (error) {
      // Clear tokens on refresh failure
      localStorage.removeItem("token")
      localStorage.removeItem("refresh_token")
      throw error
    }
  }

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`
    
    try {
      const errorData = await response.json()
      
      // Handle Django's non_field_errors format
      if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors)) {
        errorMessage = errorData.non_field_errors[0]
      }
      // Handle Django's detail field (common for DRF)
      else if (errorData.detail) {
        errorMessage = errorData.detail
      }
      // Handle other Django error formats
      else if (errorData.error) {
        errorMessage = errorData.error
      }
      // Handle field-specific errors for login
      else if (errorData.username && Array.isArray(errorData.username)) {
        errorMessage = `Username: ${errorData.username[0]}`
      } else if (errorData.password && Array.isArray(errorData.password)) {
        errorMessage = `Password: ${errorData.password[0]}`
      }
      // Handle common authentication errors
      else if (errorData.email && Array.isArray(errorData.email)) {
        errorMessage = `Email: ${errorData.email[0]}`
      }
      // If we have any other structure, try to extract a meaningful message
      else {
        // Try to find any error message in the response
        const allErrors = []
        for (const [key, value] of Object.entries(errorData)) {
          if (Array.isArray(value)) {
            allErrors.push(...value)
          } else if (typeof value === "string") {
            allErrors.push(value)
          }
        }
        
        if (allErrors.length > 0) {
          errorMessage = allErrors[0]
        }
      }
    } catch (parseError) {
      // If we can't parse the error response, use the default message
      // Keep this console.warn as it's useful for debugging API issues in production
      console.warn("Failed to parse error response:", parseError)
    }
    
    throw new Error(errorMessage)
  }

  // Check if response has content before trying to parse JSON
  const contentLength = response.headers.get('content-length')
  const contentType = response.headers.get('content-type')
  
  // If no content (204 status or empty response), return null
  if (response.status === 204 || contentLength === '0') {
    return null
  }
  
  // If response doesn't contain JSON, return null
  if (!contentType || !contentType.includes('application/json')) {
    return null
  }

  // Try to parse JSON, return null if parsing fails (empty response)
  try {
    const text = await response.text()
    return text ? JSON.parse(text) : null
  } catch (error) {
    console.warn("Failed to parse JSON response:", error)
    return null
  }
}
