import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import CalendarPage from './pages/CalendarPage';
import AdminPage from './pages/AdminPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="app-nav">
          <ul>
            <li>
              <Link to="/">日历</Link>
            </li>
            <li>
              <Link to="/admin">管理</Link>
            </li>
          </ul>
        </nav>
        
        <Routes>
          <Route path="/" element={<CalendarPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
