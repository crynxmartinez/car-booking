import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const session = sessionStorage.getItem('admin_session')
    if (session) {
      setUser(JSON.parse(session))
    }
    setLoading(false)
  }, [])

  const login = async (username, password) => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('username', username)
        .single()

      if (error || !data) {
        throw new Error('Invalid credentials')
      }

      if (data.password_hash !== password) {
        throw new Error('Invalid credentials')
      }

      await supabase
        .from('admin_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.id)

      const userData = {
        id: data.id,
        username: data.username,
        role: data.role,
      }

      setUser(userData)
      sessionStorage.setItem('admin_session', JSON.stringify(userData))

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const logout = () => {
    setUser(null)
    sessionStorage.removeItem('admin_session')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
