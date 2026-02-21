import { useState } from 'react'
import { authAPI } from '../services/api'

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const validateForm = () => {
    const newErrors = {}

    if (!formData.oldPassword.trim()) {
      newErrors.oldPassword = 'Old password is required'
    }

    if (!formData.newPassword.trim()) {
      newErrors.newPassword = 'New password is required'
    } else if (formData.newPassword.length < 5) {
      newErrors.newPassword = 'New password must be at least 5 characters'
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Confirm password is required'
    }

    if (formData.newPassword && formData.confirmPassword && formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'New password and confirm password do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setSuccessMessage('')

    try {
      const response = await authAPI.changePassword(
        formData.oldPassword,
        formData.newPassword,
        formData.confirmPassword
      )

      if (response.data.success) {
        setSuccessMessage('Password changed successfully!')
        setFormData({
          oldPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        
        // Close modal after 2 seconds
        setTimeout(() => {
          onClose()
          setSuccessMessage('')
        }, 2000)
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to change password'
      setErrors({ submit: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Change Password</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Old Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Old Password
            </label>
            <input
              type="password"
              name="oldPassword"
              value={formData.oldPassword}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.oldPassword ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your current password"
            />
            {errors.oldPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.oldPassword}</p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.newPassword ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter new password (min 5 characters)"
            />
            {errors.newPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.newPassword}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Confirm new password"
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-300 rounded-md">
              <p className="text-red-700 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="p-3 bg-green-50 border border-green-300 rounded-md">
              <p className="text-green-700 text-sm">{successMessage}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 justify-end mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors disabled:bg-blue-400"
              disabled={loading}
            >
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ChangePasswordModal
