import { apiRequest } from "./queryClient";
import type { User, LoginRequest, InsertUser } from "@shared/schema";

export interface AuthResponse {
  user: User;
}

export const authApi = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await apiRequest("POST", "/api/auth/login", credentials);
    return response.json();
  },

  register: async (userData: InsertUser): Promise<AuthResponse> => {
    const response = await apiRequest("POST", "/api/auth/register", userData);
    return response.json();
  },

  logout: async (): Promise<void> => {
    await apiRequest("POST", "/api/auth/logout");
  },

  getCurrentUser: async (): Promise<AuthResponse> => {
    const response = await apiRequest("GET", "/api/auth/me");
    return response.json();
  },
};
