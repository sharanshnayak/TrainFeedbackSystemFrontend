import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import api from '../services/api'

const FeedbackForm = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [formData, setFormData] = useState({
    feedbackNo: '',
    date: '',
    trainNo: '',
    trainName: '',
    coachNo: '',
    pnr: '',
    mobile: '',
    ns1: '',
    ns2: '',
    ns3: '',
    psi: '',
    reportDate: '',
    feedbackText: '',
    feedbackRating: '',
    totalFeedbacks: '',
    totalPercentageAtPSI: '',
    averagePSIRoundTrip: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const validateForm = () => {
    const required = [
      'feedbackNo', 'date', 'trainNo', 'trainName', 'coachNo',
      'pnr', 'mobile', 'psi', 'reportDate'
    ]

    for (let field of required) {
      if (!formData[field]) {
        toast.error(`${field.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`)
        return false
      }
    }

    if (!/^\d+$/.test(formData.pnr)) {
      toast.error('PNR must contain only numbers')
      return false
    }

    if (!/^\d{10}$/.test(formData.mobile)) {
      toast.error('Mobile must be a valid 10-digit number')
      return false
    }

    if (!formData.feedbackText && !formData.feedbackRating) {
      toast.error('Please provide either feedback text or rating')
      return false
    }

    if (formData.feedbackText) {
      const wordCount = formData.feedbackText.trim().split(/\s+/).filter(Boolean).length
      if (wordCount > 100) {
        toast.error('Feedback text cannot exceed 100 words')
        return false
      }
    }

    return true
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validateForm()) setShowConfirm(true)
  }

  const handleConfirmSubmit = async () => {
    setShowConfirm(false)
    setLoading(true)
    try {
      const response = await api.post('/feedback', formData)
      if (response.data.success) {
        toast.success('Feedback submitted successfully!')
        navigate(`/feedback/success/${response.data.data._id}`)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error submitting feedback')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => setShowConfirm(false)

  return (
    <div className="w-full max-w-6xl mx-auto px-4">
      <div className="card">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Train Feedback Form</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Feedback Number *</label>
              <input
                type="text"
                name="feedbackNo"
                value={formData.feedbackNo}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter feedback number"
                required
              />
            </div>

            <div>
              <label className="label">Date *</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Train Number *</label>
              <input
                type="text"
                name="trainNo"
                value={formData.trainNo}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter train number"
                required
              />
            </div>

            <div>
              <label className="label">Train Name *</label>
              <input
                type="text"
                name="trainName"
                value={formData.trainName}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter train name"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="label">Coach Number *</label>
              <input
                type="text"
                name="coachNo"
                value={formData.coachNo}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter coach number"
                required
              />
            </div>

            <div>
              <label className="label">PNR (Numbers only) *</label>
              <input
                type="text"
                name="pnr"
                value={formData.pnr}
                onChange={handleChange}
                className="input-field"
                placeholder="10-digit PNR"
                pattern="\d+"
                required
              />
            </div>

            <div>
              <label className="label">Mobile (10 digits) *</label>
              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                className="input-field"
                placeholder="10-digit mobile"
                pattern="\d{10}"
                maxLength="10"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="label">NS-1</label>
              <input type="number" name="ns1" value={formData.ns1} onChange={handleChange} className="input-field" placeholder="0" min="0" step="1" />
            </div>

            <div>
              <label className="label">NS-2</label>
              <input type="number" name="ns2" value={formData.ns2} onChange={handleChange} className="input-field" placeholder="0" min="0" step="1" />
            </div>

            <div>
              <label className="label">NS-3</label>
              <input type="number" name="ns3" value={formData.ns3} onChange={handleChange} className="input-field" placeholder="0" min="0" step="1" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">PSI *</label>
              <input type="number" name="psi" value={formData.psi} onChange={handleChange} className="input-field" placeholder="0" min="0" step="1" required />
            </div>

            <div>
              <label className="label">Report Date *</label>
              <input type="date" name="reportDate" value={formData.reportDate} onChange={handleChange} className="input-field" required />
            </div>
          </div>

          <div>
            <label className="label">Feedback Text (Max 100 words)
              {formData.feedbackText && (
                <span className="ml-2 text-sm text-gray-500">({formData.feedbackText.trim().split(/\s+/).filter(w => w).length} words)</span>
              )}
            </label>
            <textarea name="feedbackText" value={formData.feedbackText} onChange={handleChange} className="input-field" rows="4" placeholder="Enter detailed feedback (optional if rating is provided)" />
          </div>

          {!formData.feedbackText && (
            <div>
              <label className="label">Feedback Rating (Required if no text provided) *</label>
              <div className="flex gap-4 flex-wrap">
                {['poor', 'good', 'very good', 'excellent'].map((rating) => (
                  <label key={rating} className="flex items-center space-x-2 cursor-pointer">
                    <input type="radio" name="feedbackRating" value={rating} checked={formData.feedbackRating === rating} onChange={handleChange} className="w-4 h-4" />
                    <span className="capitalize">{rating}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="label">Total No. of Feedbacks</label>
              <input type="number" name="totalFeedbacks" value={formData.totalFeedbacks} onChange={handleChange} className="input-field" placeholder="0" min="0" />
            </div>

            <div>
              <label className="label">Total % at PSI for Rake</label>
              <input type="number" name="totalPercentageAtPSI" value={formData.totalPercentageAtPSI} onChange={handleChange} className="input-field" placeholder="0" min="0" max="100" step="0.01" />
            </div>

            <div>
              <label className="label">Average PSI at Rake (Round Trip)</label>
              <input type="number" name="averagePSIRoundTrip" value={formData.averagePSIRoundTrip} onChange={handleChange} className="input-field" placeholder="0" min="0" step="0.01" />
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <button type="submit" className="btn-primary px-12 py-3 text-lg" disabled={loading}>Submit Feedback</button>
          </div>
        </form>

        {showConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Confirm Submission</h3>
              <p className="text-gray-600 mb-6">Are you sure you want to submit this feedback? Please review all information before confirming.</p>
              <div className="flex gap-4">
                <button onClick={handleConfirmSubmit} className="flex-1 btn-primary" disabled={loading}>Yes, Submit</button>
                <button onClick={handleCancel} className="flex-1 btn-secondary" disabled={loading}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FeedbackForm
