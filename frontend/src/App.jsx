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
import LoginPage from './pages/LoginPage';
// TYSIC 2026 — New pages
import PostDischargePage from './pages/PostDischargePage';
import HealthcareDashboardPage from './pages/HealthcareDashboardPage';
import { getCurrentUser } from './services/api';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-2xl mx-auto my-12 p-8 bg-white rounded-2xl border border-red-200 shadow-sm text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Unable to display page</h2>
          <p className="text-sm text-slate-600 mb-4">{this.state.error?.message || 'An unexpected error occurred.'}</p>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.href = '/'; }}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
          >
            Return to Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [highContrast, setHighContrast] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const [currentRole, setCurrentRole] = useState(() => getCurrentUser()?.role || 'patient');

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    if (user && user.role) {
      setCurrentRole(user.role);
    }
  };

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
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
        />

        <main className="flex-1">
          <ErrorBoundary>
            <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            {/* TYSIC 2026 — Post-Discharge Care (primary patient workflow) */}
            <Route path="/post-discharge" element={<PostDischargePage />} />
            {/* TYSIC 2026 — Healthcare Professional Dashboard */}
            <Route path="/healthcare" element={<HealthcareDashboardPage />} />
            {/* Existing modality pages */}
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
          </ErrorBoundary>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
}
