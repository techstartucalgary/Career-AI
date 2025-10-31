import React from 'react'
import './App.css'
import HomePage from './pages/HomePage.jsx'
import { Routes, Route } from 'react-router-dom'

const App = () => {

  return (
      <div>
          <Routes>
            <Route path="/" element={<HomePage />} />
          </Routes>
      </div>
  )
}

export default App
