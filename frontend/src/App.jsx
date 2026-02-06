import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import LandingPage from './pages/LandingPage.jsx';
import JobsExplorePage from './pages/JobsExplorePage.jsx';
import JobPostingResumePage from './pages/JobPostingResumePage.jsx';
import CoverLetterJobPostingPage from './pages/CoverLetterJobPostingPage.jsx';
import InterviewBuddyPage from './pages/InterviewBuddyPage.jsx';
import MockInterviewPage from './pages/MockInterviewPage.jsx';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/jobs" element={<JobsExplorePage />} />
        <Route path="/jobs/:id/resume" element={<JobPostingResumePage />} />
        <Route path="/jobs/:id/cover-letter" element={<CoverLetterJobPostingPage />} />
        <Route path="/interview-buddy" element={<InterviewBuddyPage />} />
        <Route path="/mock-interview" element={<MockInterviewPage />} />
      </Routes>
    </Router>
  );
};

export default App;
