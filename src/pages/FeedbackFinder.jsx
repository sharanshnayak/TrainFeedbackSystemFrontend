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

      // Company Header (reduced size)
      doc.setFontSize(11)
      doc.setTextColor(30, 64, 175)
      doc.setFont('helvetica', 'bold')
      doc.text('Young Bengal Co-Operative Labour Contract Society Ltd.', 15, 10)

      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
      doc.text('Regd. Off: 14/1, Nirode Behari Mullick Road, Kolkata - 700 006', 15, 15)
      doc.text('Phone: 033-6535 8154 | E-mail: ybcolcs@yahoo.in', 15, 18.5)

      const headerY = 25

      // Train info header (compact)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.text(`Train No: ${trainNo}`, 15, headerY)
      doc.text(`Train Name: ${feedbacks[0]?.trainName || ''}`, 100, headerY, { align: 'center' })
      
      // Format date as dd/mm/yyyy
      const formatDateStr = () => {
        const d = new Date(date)
        const day = String(d.getDate()).padStart(2, '0')
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const year = d.getFullYear()
        return `${day}/${month}/${year}`
      }
      doc.text(`Report Date: ${formatDateStr()}`, 185, headerY, { align: 'right' })

      // Table start
      const tableStartY = headerY + 4

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
        fb.feedbackRating ?? ''
      ])

      // Add totals row
      const totalNS1 = feedbacks.reduce((sum, fb) => sum + (parseInt(fb.ns1) || 0), 0)
      const totalNS2 = feedbacks.reduce((sum, fb) => sum + (parseInt(fb.ns2) || 0), 0)
      const totalNS3 = feedbacks.reduce((sum, fb) => sum + (parseInt(fb.ns3) || 0), 0)
      const totalPSI = feedbacks.reduce((sum, fb) => sum + (parseInt(fb.psi) || 0), 0)

      body.push(['Total', '', '', '', '', totalNS1, totalNS2, totalNS3, totalPSI, ''])

      doc.autoTable({
        startY: tableStartY,
        margin: { left: 20, right: 12, bottom: 30 },
        head: [[
          'Sr. No.',
          'Feedback No.',
          'Coach',
          'PNR',
          'Mobile',
          'NS-1',
          'NS-2',
          'NS-3',
          'PSI',
          'Feedback Rating/Status'
        ]],
        body,
        theme: 'striped',
        headStyles: {
          fillColor: [30, 64, 175],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 7,
          valign: 'middle',
          halign: 'center',
          cellPadding: 2
        },
        bodyStyles: { fontSize: 6.5, valign: 'middle', halign: 'center', cellPadding: 1.5, lineColor: 200 },
        alternateRowStyles: { fillColor: [248, 248, 248] },
        columnStyles: {
          0: { cellWidth: 12, halign: 'center' },
          1: { cellWidth: 20, halign: 'center' },
          2: { cellWidth: 14, halign: 'center' },
          3: { cellWidth: 20, halign: 'center' },
          4: { cellWidth: 22, halign: 'center' },
          5: { cellWidth: 11, halign: 'center' },
          6: { cellWidth: 11, halign: 'center' },
          7: { cellWidth: 11, halign: 'center' },
          8: { cellWidth: 10, halign: 'center' },
          9: { cellWidth: 30, halign: 'center' }
        },
        didDrawCell: (data) => {
          // Highlight total row
          if (data.row.index === feedbacks.length) {
            data.cell.styles.fontStyle = 'bold'
            data.cell.styles.fillColor = [200, 200, 200]
            data.cell.styles.fontSize = 7
          }
        }
      })

      // Summary section after table (compact)
      const finalY = (doc.lastAutoTable && doc.lastAutoTable.finalY) || (tableStartY + 8)
      let y = finalY + 9

      const totalCount = feedbacks.length
      const psiSum = feedbacks.reduce((sum, fb) => sum + (parseInt(fb.psi) || 0), 0)
      const percentagePSI = totalCount > 0 ? ((psiSum / totalCount)).toFixed(2) : '0'
      const averagePSI = totalCount > 0 ? psiSum.toFixed(2) : '0'

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)

      doc.text('Total Feedbacks:', 25, y)
      doc.text(totalCount.toString(), 85, y)
      y += 5

      doc.text('Total No Percentage of PSI for the Rake:', 25, y)
      doc.text(`${percentagePSI}%`, 85, y)
      y += 5

      doc.text('Average PSI of Rake for the Round Trip:', 25, y)
      doc.text(averagePSI, 85, y)

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

      // Company Header (reduced size)
      doc.setFontSize(11)
      doc.setTextColor(30, 64, 175)
      doc.setFont('helvetica', 'bold')
      doc.text('Young Bengal Co-Operative Labour Contract Society Ltd.', 15, 10)

      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
      doc.text('Regd. Off: 14/1, Nirode Behari Mullick Road, Kolkata - 700 006', 15, 15)
      doc.text('Phone: 033-6535 8154 | E-mail: ybcolcs@yahoo.in', 15, 18.5)

      const headerY = 25

      // Train info header (compact)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.text(`Train No: ${feedback.trainNo}`, 15, headerY)
      doc.text(`Train Name: ${feedback.trainName}`, 100, headerY, { align: 'center' })
      
      // Format date as dd/mm/yyyy
      const formatDateStr = (dateStr) => {
        const d = new Date(dateStr)
        const day = String(d.getDate()).padStart(2, '0')
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const year = d.getFullYear()
        return `${day}/${month}/${year}`
      }
      doc.text(`Report Date: ${formatDateStr(feedback.reportDate)}`, 185, headerY, { align: 'right' })

      // Separator line
      doc.setDrawColor(200, 200, 200)
      doc.line(15, 22, 195, 22)

      let yPos = 30

      // Summary Details Section
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.text('Feedback Details', 15, yPos)
      yPos += 5

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)

      // Two column layout
      const col1X = 15
      const col2X = 105
      const lineHeight = 4

      doc.text(`Feedback No: ${feedback.feedbackNo}`, col1X, yPos)
      doc.text(`Coach: ${feedback.coachNo}`, col2X, yPos)
      yPos += lineHeight

      doc.text(`PNR: ${feedback.pnr}`, col1X, yPos)
      doc.text(`Mobile: ${feedback.mobile}`, col2X, yPos)
      yPos += lineHeight

      doc.text(`NS-1: ${feedback.ns1 || 0}`, col1X, yPos)
      doc.text(`NS-2: ${feedback.ns2 || 0}`, col2X, yPos)
      yPos += lineHeight

      doc.text(`NS-3: ${feedback.ns3 || 0}`, col1X, yPos)
      doc.text(`PSI: ${feedback.psi || 'N/A'}`, col2X, yPos)
      yPos += lineHeight

      if (feedback.feedbackRating) {
        doc.text(`Rating: ${feedback.feedbackRating}`, col1X, yPos)
        yPos += lineHeight
      }

      yPos += 3

      // Feedback Content
      if (feedback.feedbackText) {
        doc.setFont('helvetica', 'bold')
        doc.text('Feedback Comments:', 15, yPos)
        yPos += 4
        
        doc.setFont('helvetica', 'normal')
        const textLines = doc.splitTextToSize(feedback.feedbackText, 180)
        doc.text(textLines, 15, yPos)
        yPos += (textLines.length * 3.5)
    }

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
                              <span className={`px-2 py-1 rounded text-xs font-medium inline-block ${
                                feedback.feedbackRating === 'Excellent' ? 'bg-green-100 text-green-800' :
                                feedback.feedbackRating === 'Very Good' ? 'bg-blue-100 text-blue-800' :
                                feedback.feedbackRating === 'Good' ? 'bg-yellow-100 text-yellow-800' :
                                feedback.feedbackRating === 'Average' ? 'bg-orange-100 text-orange-800' :
                                feedback.feedbackRating === 'Poor' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
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
                            <span className={`px-3 py-1 rounded font-medium inline-block ${
                              feedback.feedbackRating === 'Excellent' ? 'bg-green-100 text-green-800' :
                              feedback.feedbackRating === 'Very Good' ? 'bg-blue-100 text-blue-800' :
                              feedback.feedbackRating === 'Good' ? 'bg-yellow-100 text-yellow-800' :
                              feedback.feedbackRating === 'Average' ? 'bg-orange-100 text-orange-800' :
                              feedback.feedbackRating === 'Poor' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {feedback.feedbackRating}
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
                    {['Poor', 'Average', 'Good', 'Very Good', 'Excellent'].map((rating) => (
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





