import * as React from 'react'
import { UserProfile } from '@/types'
import { authService } from '@/services/auth.service'
import { useAuthStorage } from '@/hooks/useAuthStorage'

export interface AuthContext {
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<LoginResponse>
  loginWith2FA: (userId: string, token: string) => Promise<LoginResponse>
  logout: () => Promise<void>
  user: UserProfile | null
  isLoading: boolean
}

export interface LoginResponse {
  user: UserProfile
  accessToken: string
  refreshToken: string
  requires2FA: boolean
}

const AuthContext = React.createContext<AuthContext | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, setAuth, clearAuth } = useAuthStorage()
  const [isLoading, setIsLoading] = React.useState(false)

  const logout = React.useCallback(async () => {
    try {
      await authService.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      clearAuth()
    }
  }, [clearAuth])

  const login = React.useCallback(async (username: string, password: string): Promise<LoginResponse> => {
    setIsLoading(true)
    try {
      const response = await authService.login({ username, password })

      if (response.requires2FA) {
        // Don't set user yet if 2FA is required
        return response
      } else {
        // Set user and tokens if login is complete
        setAuth(response.user, response.accessToken, response.refreshToken)
        return response
      }
    } finally {
      setIsLoading(false)
    }
  }, [setAuth])

  const loginWith2FA = React.useCallback(async (userId: string, token: string): Promise<LoginResponse> => {
    setIsLoading(true)
    try {
      const response = await authService.verify2FA({ userId, token })
      setAuth(response.user, response.accessToken, response.refreshToken)
      return response
    } finally {
      setIsLoading(false)
    }
  }, [setAuth])

  const value = React.useMemo(() => ({
    isAuthenticated,
    user,
    login,
    loginWith2FA,
    logout,
    isLoading,
  }), [isAuthenticated, user, login, loginWith2FA, logout, isLoading])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}