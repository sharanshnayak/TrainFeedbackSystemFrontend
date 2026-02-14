

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import api from '../services/api'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

const FeedbackSuccess = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [feedback, setFeedback] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeedback()
  }, [id])

  const fetchFeedback = async () => {
    try {
      const response = await api.get(`/feedback/${id}`)
      if (response.data.success) {
        setFeedback(response.data.data)
      }
    } catch (error) {
      toast.error('Error loading feedback')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const generatePDF = () => {
    try {
      if (!feedback) return

      const doc = new jsPDF()

    // Company Header
    doc.setFontSize(14)
    doc.setTextColor(30, 64, 175)
    doc.text('Young Bengal Co-Operative Labour Contract Society Ltd.', 105, 10, { align: 'center' })

    // Line separator
    doc.setDrawColor(200, 200, 200)
    doc.line(20, 24, 190, 24)

    // Header
    doc.setFontSize(20)
    doc.setTextColor(30, 64, 175)
    doc.text('Feedback Details', 105, 35, { align: 'center' })

    // Feedback Number
    doc.setFontSize(14)
    doc.setTextColor(0, 0, 0)
    doc.text(`Feedback #${feedback.feedbackNo}`, 105, 50, { align: 'center' })

    // Line separator
    doc.setDrawColor(200, 200, 200)
    doc.line(20, 57, 190, 57)

    let yPos = 65

    // Train Information
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Train Information', 20, yPos)
    yPos += 8
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`Train No: ${feedback.trainNo}`, 20, yPos)
    doc.text(`Date: ${new Date(feedback.date).toLocaleDateString()}`, 110, yPos)
    yPos += 6
    doc.text(`Train Name: ${feedback.trainName}`, 20, yPos)
    yPos += 6
    doc.text(`From: ${feedback.fromStation}`, 20, yPos)
    doc.text(`To: ${feedback.toStation}`, 110, yPos)
    yPos += 6
    doc.text(`Coach: ${feedback.coachNo}`, 20, yPos)
    yPos += 10

    // Contact Information
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('Contact Information', 20, yPos)
    yPos += 8
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`PNR: ${feedback.pnr}`, 20, yPos)
    doc.text(`Mobile: ${feedback.mobile}`, 110, yPos)
    yPos += 10

    // Technical Data
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('Technical Data', 20, yPos)
    yPos += 8
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`NS-1: ${feedback.ns1 || 0}`, 20, yPos)
    doc.text(`NS-2: ${feedback.ns2 || 0}`, 70, yPos)
    doc.text(`NS-3: ${feedback.ns3 || 0}`, 120, yPos)
    yPos += 6
    doc.text(`PSI: ${feedback.psi || 'N/A'}`, 20, yPos)
    yPos += 6
    doc.text(`Report Date: ${new Date(feedback.reportDate).toLocaleDateString()}`, 20, yPos)
    yPos += 10

    // Additional Metrics
    if (feedback.totalFeedbacks || feedback.totalPercentageAtPSI || feedback.averagePSIRoundTrip) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.text('Additional Metrics', 20, yPos)
      yPos += 8
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      if (feedback.totalFeedbacks) {
        doc.text(`Total Feedbacks: ${feedback.totalFeedbacks}`, 20, yPos)
        yPos += 6
      }
      if (feedback.totalPercentageAtPSI) {
        doc.text(`Total % at PSI: ${feedback.totalPercentageAtPSI}%`, 20, yPos)
        yPos += 6
      }
      if (feedback.averagePSIRoundTrip) {
        doc.text(`Avg PSI Round Trip: ${feedback.averagePSIRoundTrip}`, 20, yPos)
        yPos += 6
      }
      yPos += 4
    }

    // Feedback Content
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('Feedback', 20, yPos)
    yPos += 8

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    
    // If both exist, show only text; otherwise show whatever is available
    if (feedback.feedbackText) {
      const textLines = doc.splitTextToSize(feedback.feedbackText, 170)
      doc.text(textLines, 20, yPos)
      yPos += (textLines.length * 6)
    } else if (feedback.feedbackRating) {
      doc.text(feedback.feedbackRating.toUpperCase(), 20, yPos)
      yPos += 6
    }

    // Footer
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.line(20, doc.internal.pageSize.height - 20, 190, doc.internal.pageSize.height - 20)
    doc.text('Young Bengal Co-Operative Labour Contract Society Ltd.', 105, doc.internal.pageSize.height - 16, { align: 'center' })
    doc.text('Regd. Off: 14/1, Nirode Behari Mullick Road, Kolkata - 700 006', 105, doc.internal.pageSize.height - 12, { align: 'center' })
    doc.text('Phone: 033-6535 8154 | E-mail: ybcolcs@yahoo.in', 105, doc.internal.pageSize.height - 8, { align: 'center' })
    
    // Page number
    doc.setTextColor(150, 150, 150)
    doc.text(
      `Page 1 of 1`,
      105,
      doc.internal.pageSize.height - 4,
      { align: 'center' }
    )

    // Save PDF
    doc.save(`feedback_${feedback.feedbackNo}_${feedback.trainNo}.pdf`)
    toast.success('PDF downloaded successfully!')
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Error generating PDF: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!feedback) {
    return (
      <div className="card text-center">
        <p className="text-xl text-red-600">Feedback not found</p>
        <button
          onClick={() => navigate('/feedback')}
          className="btn-primary mt-4"
        >
          Back to Form
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card">
        {/* Success Message */}
        <div className="bg-green-50 border-l-4 border-green-500 p-6 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-2xl font-bold text-green-800">Feedback Submitted Successfully!</h3>
              <p className="text-green-700 mt-1">Your feedback has been recorded.</p>
            </div>
          </div>
        </div>

        {/* Feedback Summary */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h4 className="text-xl font-semibold mb-4">Feedback Summary</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Feedback No:</p>
              <p className="font-semibold text-lg">{feedback.feedbackNo}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Date:</p>
              <p className="font-semibold">{new Date(feedback.date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Train:</p>
              <p className="font-semibold">{feedback.trainNo} - {feedback.trainName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Route:</p>
              <p className="font-semibold">{feedback.fromStation} → {feedback.toStation}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Coach No:</p>
              <p className="font-semibold">{feedback.coachNo}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">PNR:</p>
              <p className="font-semibold">{feedback.pnr}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Mobile:</p>
              <p className="font-semibold">{feedback.mobile}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">PSI:</p>
              <p className="font-semibold">{feedback.psi || 'N/A'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <p className="text-sm text-gray-600">NS-1:</p>
              <p className="font-semibold">{feedback.ns1 || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">NS-2:</p>
              <p className="font-semibold">{feedback.ns2 || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">NS-3:</p>
              <p className="font-semibold">{feedback.ns3 || 0}</p>
            </div>
          </div>

          {(feedback.feedbackText || feedback.feedbackRating) && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600 mb-2">Feedback:</p>
              {feedback.feedbackText ? (
                <p className="text-gray-800 bg-white p-3 rounded border">{feedback.feedbackText}</p>
              ) : (
                <p className="font-semibold text-lg capitalize text-blue-600 mb-2">
                  {feedback.feedbackRating.toUpperCase()}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={generatePDF}
            className="btn-primary flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download PDF
          </button>
          
          <button
            onClick={() => navigate('/feedback')}
            className="btn-secondary"
          >
            Submit Another Feedback
          </button>
          
          <button
            onClick={() => navigate('/finder')}
            className="btn-secondary"
          >
            Find Feedbacks
          </button>
        </div>
      </div>
    </div>
  )
}

export default FeedbackSuccess




