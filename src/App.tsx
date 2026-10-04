import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ToastContainer } from './components/Toast';
import { LandingPage } from './pages/LandingPage';
import { ScanPage } from './pages/ScanPage';
import { RecyclersPage } from './pages/RecyclersPage';
import { PickupPlannerPage } from './pages/PickupPlannerPage';
import { DashboardPage } from './pages/DashboardPage';

export function App() {
  return (
    <AppProvider>
      <Router>
        <div className="min-h-screen bg-[#0A0F0D] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
          <Navbar />
          
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/scan" element={<ScanPage />} />
              <Route path="/recyclers" element={<RecyclersPage />} />
              <Route path="/pickup" element={<PickupPlannerPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <Footer />
          <ToastContainer />
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;
