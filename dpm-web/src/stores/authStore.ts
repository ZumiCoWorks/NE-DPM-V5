// Minimal shim for authStore used in various client hooks.
// This file is intentionally small and type-loose to unblock TypeScript
// while the full store refactor is deferred.
export const useAuthStore = () => {
  const initialize = () => {}
  const signIn = async (email: string, password: string) => {
    void email
    void password
    return { error: null }
  }
  const signUp = async (email: string, password: string, userData: unknown) => {
    void email
    void password
    void userData
    return { error: null }
  }
  const signOut = async () => ({ error: null })
  const updateProfile = async (updates: unknown) => {
    void updates
    return { error: null }
  }
  const getToken = async () => null

  return {
    user: null,
    loading: false,
    error: null,
    initialize,
    signIn,
    signUp,
    signOut,
    updateProfile,
    getToken,
  }
}

export default useAuthStore
