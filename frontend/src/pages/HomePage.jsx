import React, { useState } from 'react';
import Header from '../components/Header';
import './HomePage.css';

const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    console.log('Searching for:', searchQuery, 'in', location);
  };

  const features = [
    { icon: '🎯', title: 'AI Job Matching', desc: 'Smart algorithms match you with perfect opportunities' },
    { icon: '📄', title: 'Resume Optimizer', desc: 'AI-powered resume analysis and improvement tips' },
    { icon: '🚀', title: 'Career Insights', desc: 'Personalized career path recommendations' },
    { icon: '💼', title: 'Interview Prep', desc: 'Practice with AI-driven interview questions' }
  ];

  return (
    <div className="homepage">
      <Header />
      
      {/* hero section */}
      <section className="hero-section text-center">
        <div className="container">
          <h1 className="display-3 fw-bold mb-3">Find Your Dream Career with AI</h1>
          <p className="lead text-muted mb-5">Leverage artificial intelligence to discover opportunities perfectly matched to your skills and aspirations.</p>
          
          <form onSubmit={handleSearch} className="search-bar mx-auto">
            <div className="row g-2">
              <div className="col-md-5">
                <input
                  type="text"
                  className="form-control form-control-lg"
                  placeholder="Job title or keyword"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="col-md-4">
                <input
                  type="text"
                  className="form-control form-control-lg"
                  placeholder="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <button type="submit" className="btn btn-primary btn-lg w-100">
                  Search Jobs
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* features section */}
      <section className="features-section">
        <div className="container">
          <h2 className="text-center mb-5">Why Choose Career AI?</h2>
          <div className="row g-4">
            {features.map((feature, idx) => (
              <div key={idx} className="col-md-6 col-lg-3">
                <div className="feature-card text-center p-4 h-100">
                  <div className="feature-icon mb-3">{feature.icon}</div>
                  <h5 className="fw-bold mb-2">{feature.title}</h5>
                  <p className="text-muted mb-0">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* stats section */}
      <section className="stats-section bg-primary text-white">
        <div className="container">
          <div className="row text-center">
            <div className="col-md-4">
              <h2 className="display-4 fw-bold">10k+</h2>
              <p className="mb-0">Active Jobs</p>
            </div>
            <div className="col-md-4">
              <h2 className="display-4 fw-bold">5k+</h2>
              <p className="mb-0">Success Stories</p>
            </div>
            <div className="col-md-4">
              <h2 className="display-4 fw-bold">500+</h2>
              <p className="mb-0">Partner Companies</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="cta-section text-center">
        <div className="container">
          <h2 className="mb-3">Ready to Start Your Journey?</h2>
          <p className="lead text-muted mb-4">Join thousands of professionals who found their dream careers</p>
          <button className="btn btn-primary btn-lg px-5">Get Started Free</button>
        </div>
      </section>

      {/* footer */}
      <footer className="footer bg-dark text-white">
        <div className="container">
          <div className="row py-4">
            <div className="col-md-6">
              <h5 className="fw-bold mb-3">Career AI</h5>
              <p className="text-muted mb-0">Your AI-powered career companion</p>
            </div>
            <div className="col-md-6 text-md-end">
              <p className="text-muted mb-0">&copy; 2025 Career AI. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
