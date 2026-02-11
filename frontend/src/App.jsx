import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage.jsx';
import JobsExplorePage from './pages/JobsExplorePage.jsx';
import JobPostingResumePage from './pages/JobPostingResumePage.jsx';
import CoverLetterJobPostingPage from './pages/CoverLetterJobPostingPage.jsx';
import InterviewBuddyPage from './pages/InterviewBuddyPage.jsx';
import MockInterviewPage from './pages/MockInterviewPage.jsx';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public route - accessible without login */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Protected routes - require authentication */}
          <Route path="/jobs" element={
            <ProtectedRoute>
              <JobsExplorePage />
            </ProtectedRoute>
          } />
          <Route path="/jobs/:id/resume" element={
            <ProtectedRoute>
              <JobPostingResumePage />
            </ProtectedRoute>
          } />
          <Route path="/jobs/:id/cover-letter" element={
            <ProtectedRoute>
              <CoverLetterJobPostingPage />
            </ProtectedRoute>
          } />
          <Route path="/interview-buddy" element={
            <ProtectedRoute>
              <InterviewBuddyPage />
            </ProtectedRoute>
          } />
          <Route path="/mock-interview" element={
            <ProtectedRoute>
              <MockInterviewPage />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
