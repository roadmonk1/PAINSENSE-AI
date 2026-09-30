import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../services/api';
import { Shield, KeyRound, User, AlertCircle, ArrowRight, HeartHandshake, Stethoscope } from 'lucide-react';

export default function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('patient@painsense.ai');
  const [password, setPassword] = useState('patient123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await loginUser(email, password);
      if (onLoginSuccess) {
        onLoginSuccess(data.user);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (presetEmail, presetPwd) => {
    setEmail(presetEmail);
    setPassword(presetPwd);
    setError(null);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600 to-indigo-700 p-6 text-white text-center">
          <div className="inline-flex p-3 bg-white/10 rounded-xl mb-3 backdrop-blur-sm">
            <Shield className="w-8 h-8 text-sky-200" />
          </div>
          <h1 className="text-xl font-bold">Sign In to PAINSENSE-AI</h1>
          <p className="text-xs text-sky-100 mt-1">
            Multimodal Health & Accessibility Assistant
          </p>
        </div>

        {/* Demo Notice */}
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-xs text-amber-900 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>[DEMO MODE ACTIVE]</strong> Use quick-login buttons below for pre-seeded test accounts.
          </span>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick-fill preset buttons */}
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
              Quick-Select Role Account
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('patient@painsense.ai', 'patient123')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  email === 'patient@painsense.ai'
                    ? 'border-sky-500 bg-sky-50 text-sky-900 shadow-sm'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <User className="w-4 h-4 text-sky-600 mb-1" />
                <div className="font-bold text-xs">Patient</div>
                <div className="text-[10px] text-slate-500 truncate">Alex Morgan</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('caregiver@painsense.ai', 'caregiver123')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  email === 'caregiver@painsense.ai'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <HeartHandshake className="w-4 h-4 text-emerald-600 mb-1" />
                <div className="font-bold text-xs">Caregiver</div>
                <div className="text-[10px] text-slate-500 truncate">Elena Morgan</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('doctor@painsense.ai', 'doctor123')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  email === 'doctor@painsense.ai'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-900 shadow-sm'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Stethoscope className="w-4 h-4 text-indigo-600 mb-1" />
                <div className="font-bold text-xs">Doctor</div>
                <div className="text-[10px] text-slate-500 truncate">Dr. Vance</div>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-slate-900"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg shadow transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 text-sm"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In & Enter Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-[11px] text-slate-500 text-center leading-relaxed">
            By signing in, you acknowledge that PAINSENSE-AI is an assistive communication system and does not constitute medical diagnosis.
          </p>
        </div>
      </div>
    </div>
  );
}
