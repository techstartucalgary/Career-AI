import React from 'react';
import { useRouter } from 'expo-router';

export default function InterviewVideoInstructionsPage() {
  const router = useRouter();
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(180deg, #2d254c 0%, #3c2e5e 100%)',
    }}>
      <div style={{
        background: 'rgba(80, 70, 130, 0.5)',
        borderRadius: 20,
        padding: '48px 32px',
        boxShadow: '0 4px 32px rgba(0,0,0,0.15)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: 700,
      }}>
        <h1 style={{ color: '#fff', fontSize: '2.4rem', marginBottom: 32 }}>Instructions</h1>
        <ol style={{ color: '#e6e6fa', fontSize: '1.2rem', marginBottom: 32, width: '100%', paddingLeft: 0 }}>
          <li style={{ marginBottom: 18, background: '#9d8be5', borderRadius: 50, padding: '12px 24px', listStyleType: 'decimal', width: '90%' }}>Test local camera and microphone</li>
          <li style={{ marginBottom: 18, background: '#9d8be5', borderRadius: 50, padding: '12px 24px', listStyleType: 'decimal', width: '90%' }}>When you press Start, the simulation will start off with a question</li>
          <li style={{ marginBottom: 18, background: '#9d8be5', borderRadius: 50, padding: '12px 24px', listStyleType: 'decimal', width: '90%' }}>It will listen to your response and continue with more questions related to the position</li>
          <li style={{ marginBottom: 18, background: '#9d8be5', borderRadius: 50, padding: '12px 24px', listStyleType: 'decimal', width: '90%' }}>Press Start Button when you’re ready</li>
        </ol>
        <button style={{ background: '#2d254c', color: '#fff', border: 'none', borderRadius: 24, padding: '16px 48px', fontSize: '1.2rem', cursor: 'pointer', transition: 'background 0.2s' }} onClick={() => router.push('/interview')}>Continue</button>
      </div>
    </div>
  );
}
