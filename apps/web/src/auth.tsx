import * as React from 'react'
import { UserProfile } from '@/types'
import { authService } from '@/services/auth.service'

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

const accessTokenKey = 'accessToken'
const refreshTokenKey = 'refreshToken'
const userKey = 'user'

function getStoredUser(): UserProfile | null {
  try {
    const userStr = localStorage.getItem(userKey)
    return userStr ? JSON.parse(userStr) : null
  } catch {
    return null
  }
}

function getStoredTokens() {
  return {
    accessToken: localStorage.getItem(accessTokenKey),
    refreshToken: localStorage.getItem(refreshTokenKey),
  }
}

function setStoredAuth(user: UserProfile | null, accessToken: string | null, refreshToken: string | null) {
  if (user && accessToken && refreshToken) {
    localStorage.setItem(userKey, JSON.stringify(user))
    localStorage.setItem(accessTokenKey, accessToken)
    localStorage.setItem(refreshTokenKey, refreshToken)
  } else {
    localStorage.removeItem(userKey)
    localStorage.removeItem(accessTokenKey)
    localStorage.removeItem(refreshTokenKey)
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<UserProfile | null>(getStoredUser())
  const [isLoading, setIsLoading] = React.useState(false)
  const isAuthenticated = !!user && !!getStoredTokens().accessToken

  const logout = React.useCallback(async () => {
    try {
      await authService.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setStoredAuth(null, null, null)
      setUser(null)
    }
  }, [])

  const login = React.useCallback(async (username: string, password: string): Promise<LoginResponse> => {
    setIsLoading(true)
    try {
      const response = await authService.login({ username, password })
      
      if (response.requires2FA) {
        // Don't set user yet if 2FA is required
        return response
      } else {
        // Set user and tokens if login is complete
        setStoredAuth(response.user, response.accessToken, response.refreshToken)
        setUser(response.user)
        return response
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loginWith2FA = React.useCallback(async (userId: string, token: string): Promise<LoginResponse> => {
    setIsLoading(true)
    try {
      const response = await authService.verify2FA({ userId, token })
      setStoredAuth(response.user, response.accessToken, response.refreshToken)
      setUser(response.user)
      return response
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Check for stored auth on mount
  React.useEffect(() => {
    const storedUser = getStoredUser()
    const tokens = getStoredTokens()
    
    if (storedUser && tokens.accessToken) {
      setUser(storedUser)
    } else {
      // Clear any inconsistent state
      setStoredAuth(null, null, null)
      setUser(null)
    }
  }, [])

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