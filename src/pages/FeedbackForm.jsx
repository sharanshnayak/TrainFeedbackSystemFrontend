
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import axios from 'axios'

const FeedbackForm = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  
  // Form data
  const [formData, setFormData] = useState({
    date: '',
    trainNo: '',
    trainName: '',
    fromStation: '',
    toStation: '',
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

  // Dropdown options
  const [trains, setTrains] = useState([])
  const [stations, setStations] = useState([])
  const [coaches, setCoaches] = useState([])
  const [feedbackCount, setFeedbackCount] = useState(0)

  // Fetch data on mount
  useEffect(() => {
    fetchDropdownData()
  }, [])

  // Fetch feedback count when train and date change
  useEffect(() => {
    if (formData.trainNo && formData.date) {
      fetchFeedbackCount()
    }
  }, [formData.trainNo, formData.date])

  const fetchDropdownData = async () => {
    try {
      const [trainsRes, stationsRes, coachesRes] = await Promise.all([
        axios.get('/api/data/trains'),
        axios.get('/api/data/stations'),
        axios.get('/api/data/coaches')
      ])

      setTrains(trainsRes.data.data)
      setStations(stationsRes.data.data)
      setCoaches(coachesRes.data.data)
    } catch (error) {
      toast.error('Error loading form data')
      console.error(error)
    }
  }

  const fetchFeedbackCount = async () => {
    try {
      const response = await axios.get('/api/feedback/count', {
        params: {
          trainNo: formData.trainNo,
          date: formData.date
        }
      })
      setFeedbackCount(response.data.count)
    } catch (error) {
      console.error('Error fetching feedback count:', error)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    
    // Handle train selection
    if (name === 'trainNo') {
      const selectedTrain = trains.find(t => t.trainNo === value)
      setFormData(prev => ({
        ...prev,
        trainNo: value,
        trainName: selectedTrain ? selectedTrain.trainName : ''
      }))
      return
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const validateForm = () => {
    // Required fields
    const required = [
      'date', 'trainNo', 'trainName', 'fromStation', 'toStation',
      'coachNo', 'pnr', 'mobile', 'psi', 'reportDate'
    ]

    for (let field of required) {
      if (!formData[field]) {
        toast.error(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`)
        return false
      }
    }

    // PNR validation - only numbers
    if (!/^\d+$/.test(formData.pnr)) {
      toast.error('PNR must contain only numbers')
      return false
    }

    // Mobile validation - 10 digits
    if (!/^\d{10}$/.test(formData.mobile)) {
      toast.error('Mobile must be a valid 10-digit number')
      return false
    }

    // Feedback validation - either text or rating required
    if (!formData.feedbackText && !formData.feedbackRating) {
      toast.error('Please provide either feedback text or rating')
      return false
    }

    // Feedback text word count (100 words max)
    if (formData.feedbackText) {
      const wordCount = formData.feedbackText.trim().split(/\s+/).length
      if (wordCount > 100) {
        toast.error('Feedback text cannot exceed 100 words')
        return false
      }
    }

    return true
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (validateForm()) {
      setShowConfirm(true)
    }
  }

  const handleConfirmSubmit = async () => {
    setShowConfirm(false)
    setLoading(true)

    try {
      const response = await axios.post('/api/feedback', formData)
      
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

  const handleCancel = () => {
    setShowConfirm(false)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Train Feedback Form</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Feedback Number Display */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-lg font-semibold text-blue-900">
              Feedback No: {feedbackCount + 1}
            </p>
          </div>

          {/* Row 1: Date and Train */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            <div>
              <label className="label">Train Number *</label>
              <select
                name="trainNo"
                value={formData.trainNo}
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="">Select Train</option>
                {trains.map((train) => (
                  <option key={train.trainNo} value={train.trainNo}>
                    {train.trainNo} - {train.trainName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Train Name (auto-filled) */}
          <div>
            <label className="label">Train Name *</label>
            <input
              type="text"
              name="trainName"
              value={formData.trainName}
              className="input-field bg-gray-100"
              readOnly
            />
          </div>

          {/* Row 3: Stations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">From Station *</label>
              <select
                name="fromStation"
                value={formData.fromStation}
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="">Select Station</option>
                {stations.map((station) => (
                  <option key={station.code} value={station.name}>
                    {station.name} ({station.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">To Station *</label>
              <select
                name="toStation"
                value={formData.toStation}
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="">Select Station</option>
                {stations.map((station) => (
                  <option key={station.code} value={station.name}>
                    {station.name} ({station.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 4: Coach, PNR, Mobile */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="label">Coach Number *</label>
              <select
                name="coachNo"
                value={formData.coachNo}
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="">Select Coach</option>
                {coaches.map((coach) => (
                  <option key={coach} value={coach}>
                    {coach}
                  </option>
                ))}
              </select>
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

          {/* Row 5: NS-1, NS-2, NS-3, PSI and Report Date */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="label">NS-1</label>
              <input
                type="number"
                name="ns1"
                value={formData.ns1}
                onChange={handleChange}
                className="input-field"
                placeholder="0"
                min="0"
                step="1"
              />
            </div>

            <div>
              <label className="label">NS-2</label>
              <input
                type="number"
                name="ns2"
                value={formData.ns2}
                onChange={handleChange}
                className="input-field"
                placeholder="0"
                min="0"
                step="1"
              />
            </div>

            <div>
              <label className="label">NS-3</label>
              <input
                type="number"
                name="ns3"
                value={formData.ns3}
                onChange={handleChange}
                className="input-field"
                placeholder="0"
                min="0"
                step="1"
              />
            </div>
          </div>

          {/* Row 6: PSI and Report Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">PSI *</label>
              <input
                type="number"
                name="psi"
                value={formData.psi}
                onChange={handleChange}
                className="input-field"
                placeholder="0"
                min="0"
                step="1"
                required
              />
            </div>

            <div>
              <label className="label">Report Date *</label>
              <input
                type="date"
                name="reportDate"
                value={formData.reportDate}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
          </div>

          {/* Row 7: Feedback Text */}
          <div>
            <label className="label">
              Feedback Text (Max 100 words)
              {formData.feedbackText && (
                <span className="ml-2 text-sm text-gray-500">
                  ({formData.feedbackText.trim().split(/\s+/).filter(w => w).length} words)
                </span>
              )}
            </label>
            <textarea
              name="feedbackText"
              value={formData.feedbackText}
              onChange={handleChange}
              className="input-field"
              rows="4"
              placeholder="Enter detailed feedback (optional if rating is provided)"
            />
          </div>

          {/* Row 8: Rating (if no feedback text) */}
          {!formData.feedbackText && (
            <div>
              <label className="label">Feedback Rating (Required if no text provided) *</label>
              <div className="flex gap-4 flex-wrap">
                {['poor', 'good', 'very good', 'excellent'].map((rating) => (
                  <label key={rating} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="feedbackRating"
                      value={rating}
                      checked={formData.feedbackRating === rating}
                      onChange={handleChange}
                      className="w-4 h-4"
                    />
                    <span className="capitalize">{rating}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Row 9: Additional Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="label">Total No. of Feedbacks</label>
              <input
                type="number"
                name="totalFeedbacks"
                value={formData.totalFeedbacks}
                onChange={handleChange}
                className="input-field"
                placeholder="0"
                min="0"
              />
            </div>

            <div>
              <label className="label">Total % at PSI for Rake</label>
              <input
                type="number"
                name="totalPercentageAtPSI"
                value={formData.totalPercentageAtPSI}
                onChange={handleChange}
                className="input-field"
                placeholder="0"
                min="0"
                max="100"
                step="0.01"
              />
            </div>

            <div>
              <label className="label">Average PSI at Rake (Round Trip)</label>
              <input
                type="number"
                name="averagePSIRoundTrip"
                value={formData.averagePSIRoundTrip}
                onChange={handleChange}
                className="input-field"
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-4">
            <button
              type="submit"
              className="btn-primary px-12 py-3 text-lg"
              disabled={loading}
            >
              Submit Feedback
            </button>
          </div>
        </form>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Confirm Submission</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to submit this feedback? Please review all information before confirming.
            </p>
            <div className="flex gap-4">
              <button
                onClick={handleConfirmSubmit}
                className="flex-1 btn-primary"
                disabled={loading}
              >
                Yes, Submit
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FeedbackForm



