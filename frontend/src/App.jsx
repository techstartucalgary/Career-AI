
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import HomePage from './pages/HomePage.jsx';
import InterviewBuddyPage from './pages/InterviewBuddyPage.jsx';
import InterviewVideoInstructionsPage from './pages/InterviewVideoInstructionsPage.jsx';
import MockInterviewPage from './pages/MockInterviewPage.jsx';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/interview-buddy" element={<InterviewBuddyPage />} />
        <Route path="/interview-video-instructions" element={<InterviewVideoInstructionsPage />} />
        <Route path="/interview" element={<MockInterviewPage />} />
      </Routes>
    </Router>
  );
};

export default App;
