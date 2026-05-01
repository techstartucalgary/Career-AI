import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage.jsx';
import AuthenticationPage from './pages/AuthenticationPage.jsx';
import OnboardingPage from './pages/OnboardingPage.jsx';
import JobsExplorePage from './pages/JobsExplorePage.jsx';
import JobPostingPage from './pages/JobPostingPage.jsx';
import JobPostingResumePage from './pages/JobPostingResumePage.jsx';
import CoverLetterJobPostingPage from './pages/CoverLetterJobPostingPage.jsx';
import ResumePage from './pages/ResumePage.jsx';
import TemplateResumePage from './pages/TemplateResumePage.jsx';
import CoverLetterPage from './pages/CoverLetterPage.jsx';
import CoverLetterTemplatePage from './pages/CoverLetterTemplatePage.jsx';
import InterviewBuddyPage from './pages/InterviewBuddyPage.jsx';
import MockInterviewPage from './pages/MockInterviewPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import PricingPage from './pages/PricingPage.jsx';
import PaymentPage from './pages/PaymentPage.jsx';
import PaymentSuccessPage from './pages/PaymentSuccessPage.jsx';
import AutoApplyPage from './pages/AutoApplyPage.jsx';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/authentication" element={<AuthenticationPage />} />

          {/* Onboarding */}
          <Route path="/onboarding" element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          } />

          {/* Jobs */}
          <Route path="/jobs" element={
            <ProtectedRoute>
              <JobsExplorePage />
            </ProtectedRoute>
          } />
          <Route path="/job/:id" element={
            <ProtectedRoute>
              <JobPostingPage />
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

          {/* Auto Apply */}
          <Route path="/auto-apply" element={
            <ProtectedRoute>
              <AutoApplyPage />
            </ProtectedRoute>
          } />

          {/* Resume */}
          <Route path="/resume" element={
            <ProtectedRoute>
              <ResumePage />
            </ProtectedRoute>
          } />
          <Route path="/resume/template" element={
            <ProtectedRoute>
              <TemplateResumePage />
            </ProtectedRoute>
          } />

          {/* Cover Letter */}
          <Route path="/cover-letter" element={
            <ProtectedRoute>
              <CoverLetterPage />
            </ProtectedRoute>
          } />
          <Route path="/cover-letter/template" element={
            <ProtectedRoute>
              <CoverLetterTemplatePage />
            </ProtectedRoute>
          } />

          {/* Interview */}
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

          {/* Profile */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />

          {/* Pricing & Payment */}
          <Route path="/pricing" element={
            <ProtectedRoute>
              <PricingPage />
            </ProtectedRoute>
          } />
          <Route path="/payment" element={
            <ProtectedRoute>
              <PaymentPage />
            </ProtectedRoute>
          } />
          <Route path="/payment-success" element={
            <ProtectedRoute>
              <PaymentSuccessPage />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
