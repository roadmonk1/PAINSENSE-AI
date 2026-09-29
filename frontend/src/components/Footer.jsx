import React from 'react';
import { ShieldCheck, Heart, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-8 px-4 sm:px-6 lg:px-8 mt-auto text-xs">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div>
          <div className="flex items-center space-x-2 text-white font-bold text-sm mb-1">
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            <span>PAINSENSE-AI Accessibility & Health Engine</span>
          </div>
          <p className="text-slate-400 leading-relaxed max-w-sm">
            Accessible multimodal communication bridging facial observations, acoustic indicators, sign language, and self-reports.
          </p>
        </div>

        <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/80 text-amber-300">
          <div className="flex items-center space-x-1.5 font-semibold mb-1">
            <Info className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Strict Medical Disclaimer</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-tight">
            PAINSENSE-AI provides observational communication assistance, not definitive medical diagnoses. Qualified physicians remain responsible for patient diagnosis and treatment.
          </p>
        </div>

        <div className="md:text-right space-y-1">
          <div className="flex md:justify-end space-x-4">
            <Link to="/limitations" className="hover:text-white transition-colors">AI Limitations</Link>
            <Link to="/settings" className="hover:text-white transition-colors">Privacy & Consent</Link>
            <Link to="/doctor" className="hover:text-white transition-colors">Clinician Handover</Link>
          </div>
          <p className="text-slate-500 text-[11px]">
            &copy; {new Date().getFullYear()} PAINSENSE-AI. Accessibility-First Multimodal Healthcare Research.
          </p>
        </div>
      </div>
    </footer>
  );
}
