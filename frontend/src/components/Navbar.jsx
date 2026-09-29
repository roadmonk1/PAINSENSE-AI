import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Activity, Camera, Mic, Hand, Clock, HeartHandshake, Stethoscope, 
  Settings, AlertTriangle, Eye, ShieldAlert, PhoneCall, Menu, X
} from 'lucide-react';

export default function Navbar({ highContrast, setHighContrast, currentRole, setCurrentRole }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { to: "/dashboard", label: "Dashboard", icon: Activity },
    { to: "/assess", label: "Assess Pain", icon: AlertTriangle, highlight: true },
    { to: "/camera", label: "Camera", icon: Camera },
    { to: "/voice", label: "Voice", icon: Mic },
    { to: "/sign-language", label: "Sign Language", icon: Hand },
    { to: "/timeline", label: "History", icon: Clock },
    { to: "/caregiver", label: "Caregiver", icon: HeartHandshake },
    { to: "/doctor", label: "Doctor Assistance", icon: Stethoscope },
    { to: "/limitations", label: "AI Boundaries", icon: ShieldAlert },
    { to: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <header className="bg-slate-900 text-white sticky top-0 z-50 shadow-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Product Title */}
          <Link to="/" className="flex items-center space-x-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-400 rounded-lg p-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-bold text-xl shadow">
              P
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-wider block leading-none">PAINSENSE-AI</span>
              <span className="text-xs text-sky-300 font-medium tracking-wide">Multimodal Assist</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center space-x-1" aria-label="Main Navigation">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    active 
                      ? 'bg-sky-600 text-white' 
                      : item.highlight
                      ? 'bg-sky-950 text-sky-300 border border-sky-600 hover:bg-sky-900'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Accessibility & Role Controls */}
          <div className="hidden md:flex items-center space-x-3">
            {/* High Contrast Toggle */}
            <button
              onClick={() => setHighContrast(!highContrast)}
              className={`p-2 rounded-lg border text-xs font-semibold flex items-center space-x-1 transition-all ${
                highContrast 
                  ? 'bg-yellow-400 text-black border-yellow-300 font-bold' 
                  : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
              }`}
              title="Toggle High Contrast Mode (Accessibility)"
              aria-label="Toggle High Contrast Mode"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{highContrast ? "High Contrast On" : "Contrast"}</span>
            </button>

            {/* Role Switcher */}
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs">
              {['patient', 'caregiver', 'doctor'].map((role) => (
                <button
                  key={role}
                  onClick={() => setCurrentRole(role)}
                  className={`px-2 py-1 rounded capitalize font-medium transition-all ${
                    currentRole === role ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                  aria-pressed={currentRole === role}
                >
                  {role}
                </button>
              ))}
            </div>

            {/* Quick Emergency Button */}
            <Link
              to="/assess"
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 shadow transition-colors"
              title="Immediate assessment & emergency assistance"
            >
              <PhoneCall className="w-3.5 h-3.5 animate-pulse" />
              <span>Assist</span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex xl:hidden items-center space-x-2">
            <button
              onClick={() => setHighContrast(!highContrast)}
              className="p-1.5 bg-slate-800 rounded text-slate-200 text-xs"
              aria-label="Toggle Contrast"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none"
              aria-expanded={mobileMenuOpen}
              aria-label="Open main menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-6 space-y-2">
          <div className="grid grid-cols-2 gap-2 mb-3">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-2 p-2.5 rounded-lg text-sm font-medium ${
                    active ? 'bg-sky-600 text-white' : 'text-slate-300 bg-slate-800/80 hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Current Role:</span>
            <div className="flex space-x-1">
              {['patient', 'caregiver', 'doctor'].map((role) => (
                <button
                  key={role}
                  onClick={() => setCurrentRole(role)}
                  className={`px-2.5 py-1 text-xs rounded capitalize font-medium ${
                    currentRole === role ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
