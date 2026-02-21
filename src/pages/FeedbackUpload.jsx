import { useState } from 'react';
import api from '../services/api';
import { generateConsolidatedPDF } from '../services/pdfGenerator';

export default function FeedbackUpload() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadedFeedbacks, setUploadedFeedbacks] = useState([]);
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sheetData, setSheetData] = useState([]);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setErrors([]);
    setUploadedFeedbacks([]);
    setSubmitted(false);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setErrors([{ message: 'Please select a file to upload' }]);
      return;
    }

    setLoading(true);
    setErrors([]);
    setUploadedFeedbacks([]);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/feedback/upload-xlsx', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('=== FRONTEND RECEIVED RESPONSE ===');
      console.log('Response data:', response.data);
      console.log('SheetData:', response.data.sheetData);
      console.log('First feedback trainName:', response.data.feedbacks[0]?.trainName);

      if (response.data.success || response.data.feedbacks.length > 0) {
        setUploadedFeedbacks(response.data.feedbacks);
        setSheetData(response.data.sheetData || []);
        console.log('Set sheetData to:', response.data.sheetData);
        if (response.data.extractionErrors && response.data.extractionErrors.length > 0) {
          setErrors(response.data.extractionErrors);
        }
      } else {
        setErrors(response.data.errors || [{ message: 'Failed to extract feedbacks' }]);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setErrors([{ message: error.response?.data?.message || 'Error uploading file' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleReupload = () => {
    setFile(null);
    setUploadedFeedbacks([]);
    setErrors([]);
    setSubmitted(false);
    setSheetData([]);
  };

  const handleSubmit = async () => {
    if (uploadedFeedbacks.length === 0) {
      setErrors([{ message: 'No feedbacks to submit' }]);
      return;
    }

    // Validate all feedbacks on frontend
    const invalidFeedbacks = uploadedFeedbacks.filter(fb => !fb.valid);
    if (invalidFeedbacks.length > 0) {
      setErrors([{ message: `${invalidFeedbacks.length} feedbacks have validation errors. Please fix them before submitting.` }]);
      return;
    }

    setSubmitting(true);
    setErrors([]);

    try {
      const response = await api.post('/feedback/submit-bulk', {
        feedbacks: uploadedFeedbacks
      });

      if (response.data.success) {
        setSubmitted(true);
        setUploadedFeedbacks([]);
        setFile(null);
      } else {
        if (response.data.invalidFeedbacks) {
          setErrors(response.data.invalidFeedbacks);
        } else {
          setErrors([{ message: response.data.message }]);
        }
      }
    } catch (error) {
      console.error('Submit error:', error);
      setErrors([{ message: error.response?.data?.message || 'Error submitting feedbacks' }]);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloadingPDF(true);
      console.log('=== handleDownloadPDF CALLED ===');
      console.log('SheetData state:', sheetData);
      console.log('SheetData length:', sheetData?.length);
      if (sheetData && sheetData.length > 0) {
        console.log('Calling generateConsolidatedPDF with:', JSON.stringify(sheetData, null, 2));
        generateConsolidatedPDF(sheetData);
      } else {
        alert('No data to generate PDF');
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Error generating PDF: ' + error.message);
    } finally {
      setDownloadingPDF(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Upload Feedbacks</h1>
          <p className="text-gray-600">Upload your feedback report (XLSX file) to import feedbacks</p>
        </div>

        {/* File Upload Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select XLSX File
              </label>
              <input
                type="file"
                accept=".xlsx"
                onChange={handleFileChange}
                disabled={uploadedFeedbacks.length > 0}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100
                  disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {file && (
                <p className="text-sm text-gray-600 mt-2">
                  Selected: <strong>{file.name}</strong>
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleUpload}
                disabled={loading || !file || uploadedFeedbacks.length > 0}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Uploading...' : 'Upload'}
              </button>
              {uploadedFeedbacks.length > 0 && (
                <button
                  onClick={handleReupload}
                  className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition"
                >
                  Re-upload
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error Messages */}
        {errors.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8">
            <h3 className="text-red-800 font-semibold mb-2">
              {errors.length} Error{errors.length !== 1 ? 's' : ''} Found
            </h3>
            <ul className="text-red-700 text-sm space-y-1">
              {errors.map((error, idx) => (
                <li key={idx}>
                  {error.message ? 
                    error.message :
                    (error.errors?.length > 0 
                      ? `Feedback #${error.feedbackNo}: ${error.errors.join(', ')}`
                      : JSON.stringify(error))}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Submitted Success Message */}
        {submitted && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-8">
            <p className="text-green-700 font-semibold">
              ✓ Feedbacks submitted successfully!
            </p>
          </div>
        )}

        {/* Feedbacks Display Section */}
        {uploadedFeedbacks.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Extracted Feedbacks ({uploadedFeedbacks.length})
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={handleDownloadPDF}
                  disabled={downloadingPDF}
                  className="bg-purple-600 text-white px-8 py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                >
                  {downloadingPDF ? 'Generating PDF...' : 'Download PDF'}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || errors.length > 0}
                  title={errors.length > 0 ? 'Fix errors before submitting' : ''}
                  className="bg-green-600 text-white px-8 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                >
                  {submitting ? 'Submitting...' : 'Submit All'}
                </button>
              </div>
            </div>

            {/* Feedbacks Grid */}
            <div className="grid grid-cols-1 gap-6 mb-8">
              {uploadedFeedbacks.map((feedback, idx) => (
                <div
                  key={idx}
                  className={`p-6 rounded-lg border-2 ${
                    feedback.valid
                      ? 'border-green-200 bg-green-50'
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  {/* Feedback Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        Feedback #{feedback.feedbackNo}
                      </h3>
                      <p className="text-gray-600">
                        Train {feedback.trainNo}
                        {feedback.trainName && ` - ${feedback.trainName}`}
                      </p>
                    </div>
                    <span
                      className={`px-4 py-2 rounded-full text-sm font-semibold ${
                        feedback.valid
                          ? 'bg-green-200 text-green-800'
                          : 'bg-red-200 text-red-800'
                      }`}
                    >
                      {feedback.valid ? '✓ Valid' : '✗ Invalid'}
                    </span>
                  </div>

                  {/* Feedback Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <label className="text-sm text-gray-600">Coach</label>
                      <p className="font-semibold">{feedback.coachNo}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">PNR</label>
                      <p className="font-semibold">{feedback.pnr}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Mobile</label>
                      <p className="font-semibold">{feedback.mobile}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Report Date</label>
                      <p className="font-semibold">
                        {new Date(feedback.reportDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">NS-1</label>
                      <p className="font-semibold">{feedback.ns1}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">NS-2</label>
                      <p className="font-semibold">{feedback.ns2}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">NS-3</label>
                      <p className="font-semibold">{feedback.ns3}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">PSI</label>
                      <p className="font-semibold">{feedback.psi}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Feedback Status</label>
                      <p className={`font-semibold text-sm px-2 py-1 rounded text-center ${
                        feedback.feedbackStatus === 'Excellent' ? 'bg-green-100 text-green-800' :
                        feedback.feedbackStatus === 'Very Good' ? 'bg-blue-100 text-blue-800' :
                        feedback.feedbackStatus === 'Good' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {feedback.feedbackStatus || 'NA'}
                      </p>
                    </div>
                  </div>

                  {/* Validation Errors */}
                  {!feedback.valid && feedback.validationErrors?.length > 0 && (
                    <div className="bg-red-100 border border-red-300 rounded p-3">
                      <p className="text-sm text-red-700 font-semibold mb-1">Errors:</p>
                      <ul className="text-sm text-red-600 space-y-1">
                        {feedback.validationErrors.map((error, idx) => (
                          <li key={idx}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Submit Button at Bottom */}
            <div className="flex justify-end gap-2">
              <button
                onClick={handleDownloadPDF}
                disabled={downloadingPDF}
                className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition text-lg font-semibold"
              >
                {downloadingPDF ? 'Generating PDF...' : 'Download PDF'}
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition text-lg font-semibold"
              >
                {submitting ? 'Submitting...' : 'Submit All Feedbacks'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

