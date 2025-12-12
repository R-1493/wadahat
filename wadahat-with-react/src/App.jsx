// App.jsx
import { useEffect, useState } from 'react'
import { loginWithEmail, onAuthChange } from './firebase.js'
import ChatPage from './pages/ChatPage.jsx'

export default function App() {
  const [user, setUser] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    const unsubscribe = onAuthChange((currentUser) => {
      setUser(currentUser)
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleLogin = async () => {
    try {
      setError('')
      await loginWithEmail(email, password)
    } catch (err) {
      setError(err.message)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#EAEBE6]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2F6650]"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#EAEBE6]">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
          <h1 className="text-2xl font-bold text-[#2F6650] text-center mb-6">
            مرحباً بعودتك 👋
          </h1>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:border-[#2F6650] text-right"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                كلمة المرور
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:border-[#2F6650] text-right"
              />
            </div>
          </div>

          <button
            onClick={handleLogin}
            className="w-full bg-[#2F6650] hover:bg-[#265541] text-white font-medium py-3 rounded-xl mt-6 transition-colors"
            disabled={!email || !password}
          >
            تسجيل دخول
          </button>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return <ChatPage user={user} />
}
