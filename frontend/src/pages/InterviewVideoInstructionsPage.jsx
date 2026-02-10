import React from 'react';
import { useNavigate } from 'react-router-dom';
import './InterviewVideoInstructionsPage.css';

export default function InterviewVideoInstructionsPage() {
  const navigate = useNavigate();

  return (
    <div className="interview-video-instructions-container">
      <div className="interview-video-instructions-card">
        <h1 className="interview-video-instructions-title">Instructions</h1>
        <ol className="interview-video-instructions-list">
          <li>Test local camera and microphone</li>
          <li>When you press Start, the simulation will start off with a question</li>
          <li>It will listen to your response and continue with more questions related to the position</li>
          <li>Press Start Button when you’re ready</li>
        </ol>
        <button
          className="interview-video-instructions-continue"
          onClick={() => navigate('/interview')}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
