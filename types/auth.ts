export type User = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  is_superuser: boolean;
};

export type LoginCredentials = {
  username: string;
  password: string;
};

export type AuthResponse = {
  user?: User;
  access: string;
  refresh: string;
  message?: string;
};

export type AuthError = {
  error?: string;
  details?: string;
  non_field_errors?: string[];
  username?: string[];
  password?: string[];
  [key: string]: any; // Allow for other Django error fields
};
