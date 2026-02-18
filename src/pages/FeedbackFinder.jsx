import { useState } from 'react'
import { toast } from 'react-toastify'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

const FeedbackFinder = () => {
  const { user } = useAuth()
  const [trainNo, setTrainNo] = useState('')
  const [date, setDate] = useState('')
  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [editingFeedback, setEditingFeedback] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [showEditModal, setShowEditModal] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const handleSearch = async (e) => {
    e.preventDefault()

    if (!trainNo || !date) {
      toast.error('Please provide both train number and date')
      return
    }

    setLoading(true)
    setSearched(true)

    try {
      const response = await api.get('/feedback/search', {
        params: { trainNo, date }
      })

      if (response.data.success) {
        setFeedbacks(response.data.data)
        if (response.data.count === 0) {
          toast.info('No feedbacks found for this train and date')
        } else {
          toast.success(`Found ${response.data.count} feedback(s)`)
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error searching feedbacks')
      console.error(error)
      setFeedbacks([])
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setTrainNo('')
    setDate('')
    setFeedbacks([])
    setSearched(false)
  }

  const exportToPDF = () => {
    try {
      if (feedbacks.length === 0) {
        toast.error('No feedbacks to export')
        return
      }

      const doc = new jsPDF()

      // Company Header block
      doc.setFontSize(14)
      doc.setTextColor(30, 64, 175)
      doc.setFont('helvetica', 'bold')
      doc.text('Young Bengal Co-Operative Labour Contract Society Ltd.', 20, 14)

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
      doc.text('Regd. Off: 14/1, Nirode Behari Mullick Road, Kolkata - 700 006', 20, 20)
      doc.text('Phone: 033-6535 8154 | E-mail: ybcolcs@yahoo.in', 20, 26)

      // Small gap
      const headerY = 36

      // Helper function to format date as dd/mm/yyyy
      const formatDate = (dateStr) => {
        const d = new Date(dateStr)
        const day = String(d.getDate()).padStart(2, '0')
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const year = d.getFullYear()
        return `${day}/${month}/${year}`
      }

      // Single-row header: Train No (left), Train Name (center), Report Date (right)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      const trainNameForHeader = feedbacks[0]?.trainName || ''
      doc.text(`Train No: ${trainNo}`, 20, headerY)
      doc.text(`Train Name: ${trainNameForHeader}`, 105, headerY, { align: 'center' })
      doc.text(`Report Date: ${formatDate(date)}`, 190, headerY, { align: 'right' })

      // Table start
      const tableStartY = headerY + 10

      const body = feedbacks.map((fb, idx) => [
        idx + 1,
        fb.feedbackNo ?? '',
        fb.coachNo ?? '',
        fb.pnr ?? '',
        fb.mobile ?? '',
        fb.ns1 ?? '',
        fb.ns2 ?? '',
        fb.ns3 ?? '',
        fb.psi ?? '',
        fb.feedbackRating ? String(fb.feedbackRating).toUpperCase() : (fb.feedbackText ? 'TEXT' : '')
      ])

      doc.autoTable({
        startY: tableStartY,
        margin: { left: 10, right: 10 },
        head: [[
          'Sr. No.',
          'Feedback No.',
          'Coach',
          'PNR',
          'Mobile No.',
          'NS-1',
          'NS-2',
          'NS-3',
          'PSI',
          'FEEDBACK STATUS'
        ]],
        body,
        theme: 'striped',
        headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold', fontSize: 9, valign: 'middle'},
        styles: { fontSize: 9, valign: 'middle', minCellHeight: 12 },
        columnStyles: {
          0: { cellWidth: 15, fontSize: 8 },
          1: { cellWidth: 25, fontSize: 9 },
          2: { cellWidth: 15, fontSize: 9 },
          3: { cellWidth: 25, fontSize: 9 },
          4: { cellWidth: 25, fontSize: 9 },
          5: { cellWidth: 12, fontSize: 8 },
          6: { cellWidth: 12, fontSize: 8 },
          7: { cellWidth: 12, fontSize: 8 },
          8: { cellWidth: 10, fontSize: 8 },
          9: { cellWidth: 40, fontSize: 9 }
        }
      })

      // After table: three label rows with values
      const finalY = (doc.lastAutoTable && doc.lastAutoTable.finalY) || (tableStartY + 8)
      let y = finalY + 8
      
      // Calculate metrics
      const totalCount = feedbacks.length
      const psiSum = feedbacks.reduce((sum, fb) => sum + (parseInt(fb.psi) || 0), 0)
      const percentageAtPSI = totalCount > 0 ? ((psiSum / totalCount)).toFixed(2) : '0'
      const averagePSI = totalCount > 0 ? (psiSum).toFixed(2) : '0'
      
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.text('Total feedbacks', 10, y)
      doc.text(totalCount.toString(), 120, y)
      y += 8
      doc.text('Total No percentage of PSI for the Rake', 10, y)
      doc.text(`${percentageAtPSI}%`, 120, y)
      y += 8
      doc.text('Average PSI of Rake for the round trip', 10, y)
      doc.text(averagePSI, 120, y)

      // Footer on each page


      doc.save(`feedbacks_${trainNo}_${new Date(date).toISOString().split('T')[0]}.pdf`)
      toast.success('PDF exported successfully!')
    } catch (error) {
      console.error('Error exporting PDF:', error)
      toast.error('Error exporting PDF: ' + error.message)
    }
  }

  const exportSingleFeedbackPDF = (feedback) => {
    try {
      const doc = new jsPDF()

    // Company Header (only company name on top)
    doc.setFontSize(14)
    doc.setTextColor(30, 64, 175)
    doc.text('Young Bengal Co-Operative Labour Contract Society Ltd.', 105, 12, { align: 'center' })

    // Line separator (moved closer)
    doc.setDrawColor(200, 200, 200)
    doc.line(20, 20, 190, 20)

    // Header (moved up to reduce gap)
    doc.setFontSize(20)
    doc.setTextColor(30, 64, 175)
    doc.text('Feedback Details', 105, 28, { align: 'center' })

    // Feedback Number
    doc.setFontSize(14)
    doc.setTextColor(0, 0, 0)
    doc.text(`Feedback #${feedback.feedbackNo}`, 105, 40, { align: 'center' })

    // Line separator (below header)
    doc.setDrawColor(200, 200, 200)
    doc.line(20, 46, 190, 46)

    let yPos = 54

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
    // From/To stations removed from data model
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

    doc.save(`feedback_${feedback.feedbackNo}_${feedback.trainNo}.pdf`)
    toast.success('PDF downloaded successfully!')
    } catch (error) {
      console.error('Error downloading PDF:', error)
      toast.error('Error downloading PDF: ' + error.message)
    }
  }

  const handleEditClick = (feedback) => {
    setEditingFeedback(feedback)
    setEditForm({ ...feedback })
    setShowEditModal(true)
  }

  const handleEditChange = (e) => {
    const { name, value } = e.target
    setEditForm({ ...editForm, [name]: value })
  }

  const handleSaveEdit = async () => {
    try {
      // Prepare data for submission
      const dataToSubmit = { ...editForm }
      
      // If no feedback text but rating exists, store rating in feedbackText field
      if (!dataToSubmit.feedbackText && dataToSubmit.feedbackRating) {
        dataToSubmit.feedbackText = dataToSubmit.feedbackRating
      }
      
      // Set default values for ns1, ns2, ns3 if empty
      if (!dataToSubmit.ns1 || dataToSubmit.ns1 === '') dataToSubmit.ns1 = 0
      if (!dataToSubmit.ns2 || dataToSubmit.ns2 === '') dataToSubmit.ns2 = 0
      if (!dataToSubmit.ns3 || dataToSubmit.ns3 === '') dataToSubmit.ns3 = 0
      
      const response = await api.put(`/feedback/${editingFeedback._id}`, dataToSubmit)
      if (response.data.success) {
        toast.success('Feedback updated successfully!')
        setShowEditModal(false)
        setEditingFeedback(null)
        setEditForm({})
        // Refresh feedbacks
        const searchResponse = await api.get('/feedback/search', {
          params: { trainNo, date }
        })
        if (searchResponse.data.success) {
          setFeedbacks(searchResponse.data.data)
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating feedback')
      console.error(error)
    }
  }

  const handleDeleteClick = (feedbackId) => {
    if (window.confirm('Are you sure you want to delete this feedback?')) {
      setDeleting(feedbackId)
      handleDeleteConfirm(feedbackId)
    }
  }

  const handleDeleteConfirm = async (feedbackId) => {
    try {
      const response = await api.delete(`/feedback/${feedbackId}`)
      if (response.data.success) {
        toast.success('Feedback deleted successfully!')
        setDeleting(null)
        // Refresh feedbacks
        const searchResponse = await api.get('/feedback/search', {
          params: { trainNo, date }
        })
        if (searchResponse.data.success) {
          setFeedbacks(searchResponse.data.data)
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error deleting feedback')
      console.error(error)
      setDeleting(null)
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4">
      <div className="card">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Find Feedbacks</h2>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Train Number</label>
              <input
                type="text"
                value={trainNo}
                onChange={(e) => setTrainNo(e.target.value)}
                className="input-field"
                placeholder="e.g., 12301"
                disabled={loading}
              />
            </div>

            <div>
              <label className="label">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input-field"
                disabled={loading}
              />
            </div>

            <div className="flex flex-col sm:flex-row items-end gap-2">
              <button
                type="submit"
                className="btn-primary flex-1 w-full sm:w-auto"
                disabled={loading}
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="btn-secondary w-full sm:w-auto"
                disabled={loading}
              >
                Reset
              </button>
            </div>
          </div>
        </form>

        {/* Results */}
        {searched && (
          <>
            {feedbacks.length > 0 ? (
              <>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                  <h3 className="text-lg md:text-xl font-semibold">
                    Found {feedbacks.length} Feedback{feedbacks.length !== 1 ? 's' : ''}
                  </h3>
                  <button
                    onClick={exportToPDF}
                    className="btn-primary flex items-center justify-center gap-2 w-full md:w-auto"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export to PDF
                  </button>
                </div>

                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full bg-white">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="px-3 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-semibold text-gray-700 border-b">
                          Feedback No
                        </th>
                        <th className="px-3 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-semibold text-gray-700 border-b">
                          Train
                        </th>
                        <th className="px-3 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-semibold text-gray-700 border-b">
                          Coach
                        </th>
                        <th className="px-3 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-semibold text-gray-700 border-b">
                          PNR
                        </th>
                        <th className="px-3 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-semibold text-gray-700 border-b">
                          Mobile
                        </th>
                        <th className="px-3 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-semibold text-gray-700 border-b">
                          PSI
                        </th>
                        <th className="px-3 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-semibold text-gray-700 border-b">
                          Feedback
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {feedbacks.map((feedback, index) => (
                        <tr
                          key={feedback._id}
                          className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                        >
                          <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm border-b">
                            <span className="font-semibold text-blue-600">
                              {feedback.feedbackNo}
                            </span>
                          </td>
                          <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm border-b">
                            <div>
                              <div className="font-medium">{feedback.trainNo}</div>
                              <div className="text-gray-600 text-xs">{feedback.trainName}</div>
                            </div>
                          </td>
                          <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm border-b">
                            {feedback.coachNo}
                          </td>
                          <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm border-b">
                            {feedback.pnr}
                          </td>
                          <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm border-b">
                            {feedback.mobile}
                          </td>
                          <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm border-b">
                            <span className="font-medium">{feedback.psi || 'N/A'}</span>
                          </td>
                          <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm border-b">
                            {feedback.feedbackText ? (
                              <div className="text-gray-600 text-xs">
                                {feedback.feedbackText.substring(0, 40)}...
                              </div>
                            ) : feedback.feedbackRating ? (
                              <span className={`px-2 py-1 rounded text-xs font-medium capitalize inline-block ${
                                feedback.feedbackRating === 'excellent' ? 'bg-green-100 text-green-800' :
                                feedback.feedbackRating === 'very good' ? 'bg-blue-100 text-blue-800' :
                                feedback.feedbackRating === 'good' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {feedback.feedbackRating}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">N/A</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Detailed View */}
                <div className="mt-8 space-y-4">
                  <h4 className="text-lg md:text-xl font-semibold">Detailed Feedbacks</h4>
                  {feedbacks.map((feedback) => (
                    <div key={feedback._id} className="bg-gray-50 rounded-lg p-4 md:p-6 border border-gray-200">
                      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                        <div>
                          <span className="text-lg font-bold text-blue-600">
                            Feedback #{feedback.feedbackNo}
                          </span>
                        </div>
                        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                          <button
                            onClick={() => exportSingleFeedbackPDF(feedback)}
                            className="btn-primary flex items-center gap-2 text-xs md:text-sm px-3 md:px-4 py-2 w-full md:w-auto justify-center"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download PDF
                          </button>
                          {user?.role === 'operator' && (
                            <>
                              <button
                                onClick={() => handleEditClick(feedback)}
                                className="btn-primary flex items-center gap-2 text-xs md:text-sm px-3 md:px-4 py-2 w-full md:w-auto justify-center bg-blue-500 hover:bg-blue-600 text-white"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteClick(feedback._id)}
                                disabled={deleting === feedback._id}
                                className="flex items-center gap-2 text-xs md:text-sm px-3 md:px-4 py-2 rounded w-full md:w-auto justify-center bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <h5 className="font-semibold text-gray-700 border-b pb-1 text-sm md:text-base">Train Details</h5>
                          <div className="text-xs md:text-sm">
                            <span className="text-gray-600">Train No:</span>
                            <span className="ml-2 font-medium">{feedback.trainNo}</span>
                          </div>
                          <div className="text-xs md:text-sm">
                            <span className="text-gray-600">Train Name:</span>
                            <span className="ml-2 font-medium">{feedback.trainName}</span>
                          </div>
                          {/* From/To stations removed */}
                          <div className="text-xs md:text-sm">
                            <span className="text-gray-600">Coach:</span>
                            <span className="ml-2 font-medium">{feedback.coachNo}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h5 className="font-semibold text-gray-700 border-b pb-1 text-sm md:text-base">Contact & Technical</h5>
                          <div className="text-xs md:text-sm">
                            <span className="text-gray-600">PNR:</span>
                            <span className="ml-2 font-medium">{feedback.pnr}</span>
                          </div>
                          <div className="text-xs md:text-sm">
                            <span className="text-gray-600">Mobile:</span>
                            <span className="ml-2 font-medium">{feedback.mobile}</span>
                          </div>
                          <div className="text-xs md:text-sm">
                            <span className="text-gray-600">NS-1:</span>
                            <span className="ml-2 font-medium">{feedback.ns1 || 0}</span>
                          </div>
                          <div className="text-xs md:text-sm">
                            <span className="text-gray-600">NS-2:</span>
                            <span className="ml-2 font-medium">{feedback.ns2 || 0}</span>
                          </div>
                          <div className="text-xs md:text-sm">
                            <span className="text-gray-600">NS-3:</span>
                            <span className="ml-2 font-medium">{feedback.ns3 || 0}</span>
                          </div>
                          <div className="text-xs md:text-sm">
                            <span className="text-gray-600">PSI:</span>
                            <span className="ml-2 font-medium text-blue-600">{feedback.psi || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      {(feedback.feedbackText || feedback.feedbackRating) && (
                        <div className="mt-4 pt-4 border-t">
                          <h5 className="font-semibold text-gray-700 mb-2">Feedback:</h5>
                          {feedback.feedbackText ? (
                            <p className="text-gray-800 bg-white p-3 rounded border">{feedback.feedbackText}</p>
                          ) : (
                            <span className={`px-3 py-1 rounded font-medium capitalize inline-block ${
                              feedback.feedbackRating === 'excellent' ? 'bg-green-100 text-green-800' :
                              feedback.feedbackRating === 'very good' ? 'bg-blue-100 text-blue-800' :
                              feedback.feedbackRating === 'good' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {feedback.feedbackRating.toUpperCase()}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No feedbacks found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try searching with a different train number or date.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">Edit Feedback #{editingFeedback.feedbackNo}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="label">Feedback No.</label>
                  <input
                    type="number"
                    name="feedbackNo"
                    value={editForm.feedbackNo || ''}
                    onChange={handleEditChange}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Train No.</label>
                  <input
                    type="text"
                    name="trainNo"
                    value={editForm.trainNo || ''}
                    onChange={handleEditChange}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Train Name</label>
                  <input
                    type="text"
                    name="trainName"
                    value={editForm.trainName || ''}
                    onChange={handleEditChange}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Coach No.</label>
                  <input
                    type="text"
                    name="coachNo"
                    value={editForm.coachNo || ''}
                    onChange={handleEditChange}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">PNR</label>
                  <input
                    type="text"
                    name="pnr"
                    value={editForm.pnr || ''}
                    onChange={handleEditChange}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Mobile No.</label>
                  <input
                    type="text"
                    name="mobile"
                    value={editForm.mobile || ''}
                    onChange={handleEditChange}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">NS-1</label>
                  <input
                    type="number"
                    name="ns1"
                    value={editForm.ns1 || ''}
                    onChange={handleEditChange}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">NS-2</label>
                  <input
                    type="number"
                    name="ns2"
                    value={editForm.ns2 || ''}
                    onChange={handleEditChange}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">NS-3</label>
                  <input
                    type="number"
                    name="ns3"
                    value={editForm.ns3 || ''}
                    onChange={handleEditChange}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">PSI</label>
                  <input
                    type="number"
                    name="psi"
                    value={editForm.psi || ''}
                    onChange={handleEditChange}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="label">Feedback Text</label>
                <textarea
                  name="feedbackText"
                  value={editForm.feedbackText || ''}
                  onChange={handleEditChange}
                  rows="3"
                  className="input-field"
                />
              </div>

              {!editForm.feedbackText && (
                <div className="mb-6">
                  <label className="label">Feedback Rating (Required if no text provided) *</label>
                  <div className="flex gap-4 flex-wrap">
                    {['poor', 'average', 'good', 'very good', 'excellent'].map((rating) => (
                      <label key={rating} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="feedbackRating"
                          value={rating}
                          checked={editForm.feedbackRating === rating}
                          onChange={handleEditChange}
                          className="w-4 h-4"
                        />
                        <span className="capitalize">{rating}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={handleSaveEdit}
                  className="btn-primary flex-1"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingFeedback(null)
                    setEditForm({})
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FeedbackFinder





