import React from 'react';
import { useNavigate } from 'react-router-dom';
import './InterviewBuddyPage.css';

export default function InterviewBuddyPage() {
  const navigate = useNavigate();

  return (
    <div className="interview-buddy-container">
      <div className="interview-buddy-card">
        <h1 className="interview-buddy-title">AI Interview Buddy</h1>
        <div className="interview-buddy-buttons">
          <div className="interview-buddy-btn-card">
            <h2>Top 10 Questions</h2>
            <p>Enter a job posting, and we’ll generate the top 10 asked interview questions and the best answers</p>
            <button onClick={() => navigate('/interview')}>Go to Questions</button>
          </div>
          <div className="interview-buddy-btn-card">
            <h2>Video simulation</h2>
            <p>Practice online interviews</p>
            <button onClick={() => navigate('/interview-video-instructions')}>Go to Video Simulation</button>
          </div>
        </div>
      </div>
    </div>
  );
}
