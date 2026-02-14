



import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuth } from '../context/AuthContext'

const Login = () => {
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!userId || !password) {
      toast.error('Please enter both User ID and Password')
      return
    }

    setLoading(true)
    const result = await login(userId, password)
    setLoading(false)

    if (result.success) {
      toast.success('Login successful!')
      navigate('/feedback')
    } else {
      toast.error(result.message || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700 px-4">
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-xl md:text-3xl font-bold text-gray-800 mb-2">Young Bengal Co-Operative Labour Contract Society Ltd.</h1>
          <h2 className="text-2xl md:text-2xl font-bold text-blue-600 mb-2">Train Feedback System</h2>
          <p className="text-sm md:text-base text-gray-600">Please login to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="label">User ID</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="input-field"
              placeholder="Enter your user ID"
              disabled={loading}
              autoFocus
            />
          </div>

          <div>
            <label className="label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="Enter your password"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="w-full btn-primary text-base md:text-base py-2"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-xs md:text-sm text-gray-600 text-center">
            <strong>Demo Credentials:</strong><br />
            User ID: admin | Password: admin123
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
