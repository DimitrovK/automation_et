export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  is_staff: boolean
  is_superuser: boolean
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface AuthResponse {
  user?: User
  access: string
  refresh: string
  message?: string
}

export interface AuthError {
  error?: string
  details?: string
  non_field_errors?: string[]
  username?: string[]
  password?: string[]
  [key: string]: any // Allow for other Django error fields
}
