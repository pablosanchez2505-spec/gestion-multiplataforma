export type UserRole = 'admin' | 'user';

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
}

export interface LoginResponse {
  user: User;
  token: string;
}