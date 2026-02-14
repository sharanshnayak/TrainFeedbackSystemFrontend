import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import FeedbackForm from './pages/FeedbackForm'
import FeedbackFinder from './pages/FeedbackFinder'
import FeedbackSuccess from './pages/FeedbackSuccess'
import Layout from './components/Layout'

function App() {
  const { user } = useAuth()

  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to={user.role === 'admin' ? '/finder' : '/feedback'} />} />
        
        <Route element={<Layout />}>
          <Route 
            path="/feedback" 
            element={user ? (user.role === 'operator' ? <FeedbackForm /> : <Navigate to="/finder" />) : <Navigate to="/login" />} 
          />
          <Route 
            path="/feedback/success/:id" 
            element={user ? (user.role === 'operator' ? <FeedbackSuccess /> : <Navigate to="/finder" />) : <Navigate to="/login" />} 
          />
          <Route 
            path="/finder" 
            element={user ? <FeedbackFinder /> : <Navigate to="/login" />} 
          />
        </Route>
        
        <Route path="/" element={<Navigate to={user ? (user.role === 'admin' ? '/finder' : '/feedback') : "/login"} />} />
      </Routes>
    </Router>
  )
}

export default App