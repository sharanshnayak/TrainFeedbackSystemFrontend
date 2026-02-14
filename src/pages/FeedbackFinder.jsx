import { useState } from 'react'
import { toast } from 'react-toastify'
import api from '../services/api'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

const FeedbackFinder = () => {
  const [trainNo, setTrainNo] = useState('')
  const [date, setDate] = useState('')
  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

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

    // Company Header (only company name on top)
    doc.setFontSize(14)
    doc.setTextColor(30, 64, 175)
    doc.text('Young Bengal Co-Operative Labour Contract Society Ltd.', 105, 12, { align: 'center' })

    // Line separator (moved closer)
    doc.setDrawColor(200, 200, 200)
    doc.line(20, 20, 190, 20)

    // Header (moved up to reduce gap)
    doc.setFontSize(18)
    doc.setTextColor(30, 64, 175)
    doc.text('Train Feedback Report', 105, 28, { align: 'center' })

    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)
    doc.text(`Train No: ${trainNo}`, 105, 34, { align: 'center' })
    doc.text(`Date: ${new Date(date).toLocaleDateString()}`, 105, 40, { align: 'center' })
    doc.text(`Total Feedbacks: ${feedbacks.length}`, 105, 46, { align: 'center' })

    // Line separator (below header)
    doc.setDrawColor(200, 200, 200)
    doc.line(20, 52, 190, 52)

    // Table data
    const tableData = feedbacks.map(fb => [
      fb.feedbackNo,
      fb.trainName,
      `${fb.fromStation} → ${fb.toStation}`,
      fb.coachNo,
      fb.psi || 'N/A',
      fb.feedbackRating || 'Text',
      new Date(fb.createdAt).toLocaleDateString()
    ])

    doc.autoTable({
      startY: 60,
      head: [['#', 'Train', 'Route', 'Coach', 'PSI', 'Rating', 'Date']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [30, 64, 175],
        textColor: 255,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 8,
        cellPadding: 2
      },
      columnStyles: {
        0: { cellWidth: 12 },
        1: { cellWidth: 30 },
        2: { cellWidth: 35 },
        3: { cellWidth: 18 },
        4: { cellWidth: 15 },
        5: { cellWidth: 18 },
        6: { cellWidth: 23 }
      }
    })

    // Footer
    const pageCount = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      
      // Company info footer
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      doc.line(20, doc.internal.pageSize.height - 20, 190, doc.internal.pageSize.height - 20)
      doc.text('Young Bengal Co-Operative Labour Contract Society Ltd.', 105, doc.internal.pageSize.height - 16, { align: 'center' })
      doc.text('Regd. Off: 14/1, Nirode Behari Mullick Road, Kolkata - 700 006', 105, doc.internal.pageSize.height - 12, { align: 'center' })
      doc.text('Phone: 033-6535 8154 | E-mail: ybcolcs@yahoo.in', 105, doc.internal.pageSize.height - 8, { align: 'center' })
      
      // Page number
      doc.setTextColor(150, 150, 150)
      doc.text(
        `Page ${i} of ${pageCount}`,
        105,
        doc.internal.pageSize.height - 4,
        { align: 'center' }
      )
    }

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

    doc.save(`feedback_${feedback.feedbackNo}_${feedback.trainNo}.pdf`)
    toast.success('PDF downloaded successfully!')
    } catch (error) {
      console.error('Error downloading PDF:', error)
      toast.error('Error downloading PDF: ' + error.message)
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
                          From Station
                        </th>
                        <th className="px-3 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-semibold text-gray-700 border-b">
                          To Station
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
                            {feedback.fromStation}
                          </td>
                          <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm border-b">
                            {feedback.toStation}
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
                        <button
                          onClick={() => exportSingleFeedbackPDF(feedback)}
                          className="btn-primary flex items-center gap-2 text-xs md:text-sm px-3 md:px-4 py-2 w-full md:w-auto justify-center md:justify-start"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Download PDF
                        </button>
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
                          <div className="text-xs md:text-sm">
                            <span className="text-gray-600">From Station:</span>
                            <span className="ml-2 font-medium">{feedback.fromStation}</span>
                          </div>
                          <div className="text-xs md:text-sm">
                            <span className="text-gray-600">To Station:</span>
                            <span className="ml-2 font-medium">{feedback.toStation}</span>
                          </div>
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
    </div>
  )
}

export default FeedbackFinder





