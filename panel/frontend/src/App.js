import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Server, Files, Terminal, Settings as SettingsIcon, BarChart } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import ServerDetail from './pages/ServerDetail';
import FileManager from './pages/FileManager';
import Console from './pages/Console';
import Logs from './pages/Logs';
import Settings from './pages/Settings';

function Sidebar() {
  const location = useLocation();
  
  return (
    <div className="sidebar">
      <h1>HyController</h1>
      <nav>
        <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
          <Server size={18} style={{ display: 'inline', marginRight: '8px' }} />
          Servidores
        </Link>
      </nav>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="app">
        <Sidebar />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/server/:id" element={<ServerDetail />} />
            <Route path="/server/:id/files" element={<FileManager />} />
            <Route path="/server/:id/console" element={<Console />} />
            <Route path="/server/:id/logs" element={<Logs />} />
            <Route path="/server/:id/settings" element={<Settings />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
