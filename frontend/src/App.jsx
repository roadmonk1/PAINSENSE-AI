import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import AssessPainPage from './pages/AssessPainPage';
import CameraPage from './pages/CameraPage';
import VoicePage from './pages/VoicePage';
import SignLanguagePage from './pages/SignLanguagePage';
import TimelinePage from './pages/TimelinePage';
import CaregiverPage from './pages/CaregiverPage';
import DoctorAssistancePage from './pages/DoctorAssistancePage';
import AILimitationsPage from './pages/AILimitationsPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  const [highContrast, setHighContrast] = useState(false);
  const [currentRole, setCurrentRole] = useState('patient'); // patient, caregiver, doctor

  useEffect(() => {
    if (highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  }, [highContrast]);

  return (
    <BrowserRouter>
      <div className={`min-h-screen flex flex-col font-sans transition-colors ${highContrast ? 'bg-black text-white' : 'bg-slate-50 text-slate-900'}`}>
        <Navbar 
          highContrast={highContrast} 
          setHighContrast={setHighContrast} 
          currentRole={currentRole} 
          setCurrentRole={setCurrentRole} 
        />

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/assess" element={<AssessPainPage />} />
            <Route path="/camera" element={<CameraPage />} />
            <Route path="/voice" element={<VoicePage />} />
            <Route path="/sign-language" element={<SignLanguagePage />} />
            <Route path="/timeline" element={<TimelinePage />} />
            <Route path="/caregiver" element={<CaregiverPage />} />
            <Route path="/doctor" element={<DoctorAssistancePage />} />
            <Route path="/limitations" element={<AILimitationsPage />} />
            <Route path="/settings" element={<SettingsPage highContrast={highContrast} setHighContrast={setHighContrast} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
}
