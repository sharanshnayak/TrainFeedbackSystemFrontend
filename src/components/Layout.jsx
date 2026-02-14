import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Layout = () => {
  const { user, logout } = useAuth()
  const location = useLocation()

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navbar */}
      <nav className="bg-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-3">
          {/* Company Name */}
          <div className="text-center mb-3 border-b border-blue-500 pb-2">
            <h1 className="text-lg md:text-xl font-bold">Young Bengal Co-Operative Labour Contract Society Ltd.</h1>
          </div>
          
          {/* Navigation Content */}
          <div className="flex flex-col md:flex-row justify-between items-center md:items-center gap-4">
            {/* Logo/Title */}
            <div className="flex items-center gap-4 flex-wrap justify-center md:justify-start">
              <h2 className="text-xl md:text-2xl font-bold">Train Feedback System</h2>
            </div>

            {/* Navigation Links */}
            <div className="flex flex-wrap justify-center gap-2 md:gap-4">
              {user?.role === 'operator' && (
                <Link
                  to="/feedback"
                  className={`px-3 md:px-4 py-2 rounded-md transition-colors text-sm md:text-base ${
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
                className={`px-3 md:px-4 py-2 rounded-md transition-colors text-sm md:text-base ${
                  location.pathname === '/finder'
                    ? 'bg-blue-700'
                    : 'hover:bg-blue-700'
                }`}
              >
                Find Feedback
              </Link>
            </div>

            {/* User Info & Logout */}
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
              <span className="text-xs md:text-sm text-center md:text-right">
                Welcome, <span className="font-semibold">{user?.name}</span> ({user?.role})
              </span>
              <button
                onClick={logout}
                className="px-3 md:px-4 py-2 bg-red-500 hover:bg-red-600 rounded-md transition-colors text-sm md:text-base"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6 md:py-8 w-full">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white shadow-lg mt-12">
        <div className="container mx-auto px-4 py-8 md:py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-6">
            {/* Company Name */}
            <div className="text-center md:text-left">
              <h3 className="text-lg md:text-xl font-bold mb-2">Young Bengal Co-Operative Labour Contract Society Ltd.</h3>
              <p className="text-gray-300 text-sm">Train Feedback Management System</p>
            </div>

            {/* Address */}
            <div className="text-center md:text-left">
              <h4 className="font-semibold mb-2 text-base md:text-lg">Registered Address</h4>
              <p className="text-gray-300 text-sm leading-relaxed">
                14/1, Nirode Behari Mullick Road<br/>
                Kolkata - 700 006
              </p>
            </div>

            {/* Contact Info */}
            <div className="text-center md:text-left">
              <h4 className="font-semibold mb-2 text-base md:text-lg">Contact Information</h4>
              <p className="text-gray-300 text-sm mb-1">
                <span className="font-medium">Phone:</span> 033-6535 8154
              </p>
              <p className="text-gray-300 text-sm">
                <span className="font-medium">E-mail:</span> <a href="mailto:ybcolcs@yahoo.in" className="hover:text-blue-400 transition-colors">ybcolcs@yahoo.in</a>
              </p>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="border-t border-gray-700 pt-4">
            <p className="text-center text-gray-400 text-xs md:text-sm">
              © {new Date().getFullYear()} Young Bengal Co-Operative Labour Contract Society Ltd. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout