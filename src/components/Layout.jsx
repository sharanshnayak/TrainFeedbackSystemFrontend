import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Layout = () => {
  const { user, logout } = useAuth()
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold">Train Feedback System</h1>
              <div className="flex space-x-4">
                {user?.role === 'operator' && (
                  <Link
                    to="/feedback"
                    className={`px-4 py-2 rounded-md transition-colors ${
                      location.pathname === '/feedback'
                        ? 'bg-blue-700'
                        : 'hover:bg-blue-700'
                    }`}
                  >
                    New Feedback
                  </Link>
                )}
                <Link
                  to="/finder"
                  className={`px-4 py-2 rounded-md transition-colors ${
                    location.pathname === '/finder'
                      ? 'bg-blue-700'
                      : 'hover:bg-blue-700'
                  }`}
                >
                  Find Feedback
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm">Welcome, {user?.name} ({user?.role})</span>
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-md transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout