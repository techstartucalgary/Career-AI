import React from 'react';
import { useRouter } from 'expo-router';
import styles from '../../src/pages/InterviewBuddyPage.css';

export default function InterviewBuddyPage() {
  const router = useRouter();

  return (
    <div className="interview-buddy-container">
      <div className="interview-buddy-card">
        <h1 className="interview-buddy-title">AI Interview Buddy</h1>
        <div className="interview-buddy-buttons">
          <div className="interview-buddy-btn-card">
            <h2>Top 10 Questions</h2>
            <p>Enter a job posting, and we’ll generate the top 10 asked interview questions and the best answers</p>
            <button onClick={() => router.push('/interview')}>Go to Questions</button>
          </div>
          <div className="interview-buddy-btn-card">
            <h2>Video simulation</h2>
            <p>Let’s practice online interviews</p>
            <button onClick={() => router.push('/interview-buddy/video-instructions')}>Go to Video Simulation</button>
          </div>
        </div>
      </div>
    </div>
  );
}
