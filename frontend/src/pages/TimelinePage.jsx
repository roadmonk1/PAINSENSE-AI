import React, { useState, useEffect } from 'react';
import { Clock, Filter, AlertTriangle, Activity, Calendar, Search, ArrowUpDown } from 'lucide-react';
import { getTimeline } from '../services/api';

export default function TimelinePage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('');
  const [modalityFilter, setModalityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await getTimeline(severityFilter || null, modalityFilter || null);
      setEvents(data || []);
    } catch (err) {
      console.error("Failed to load timeline events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [severityFilter, modalityFilter]);

  const filteredEvents = events.filter(e => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (e.title && e.title.toLowerCase().includes(q)) ||
           (e.description && e.description.toLowerCase().includes(q)) ||
           (e.modality && e.modality.toLowerCase().includes(q));
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Title */}
      <div>
        <div className="flex items-center space-x-2 text-sky-600 font-bold text-xs uppercase tracking-wider mb-1">
          <Clock className="w-4 h-4" />
          <span>Longitudinal Telemetry & Symptom Progression</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Pain & Communication Timeline
        </h1>
        <p className="text-slate-600 text-sm mt-1 max-w-3xl">
          Visual progression of reported episodes, observational indicators, and clinical handovers across all communication channels.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search symptoms, location, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center space-x-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-bold text-slate-600">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="p-2 rounded-lg border border-slate-200 bg-slate-50 font-medium focus:outline-none"
            >
              <option value="">All Severities</option>
              <option value="routine">Routine</option>
              <option value="mild">Mild</option>
              <option value="moderate">Moderate</option>
              <option value="severe">Severe</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-slate-600">Modality:</span>
            <select
              value={modalityFilter}
              onChange={(e) => setModalityFilter(e.target.value)}
              className="p-2 rounded-lg border border-slate-200 bg-slate-50 font-medium focus:outline-none"
            >
              <option value="">All Channels</option>
              <option value="camera">Camera / Optical</option>
              <option value="voice">Voice / Speech</option>
              <option value="sign">Sign Language</option>
              <option value="self-report">Self-Report</option>
            </select>
          </div>

          {(severityFilter || modalityFilter || searchQuery) && (
            <button
              onClick={() => {
                setSeverityFilter('');
                setModalityFilter('');
                setSearchQuery('');
              }}
              className="text-xs font-bold text-sky-600 hover:underline px-2 py-1"
            >
              Reset
            </button>
          )}
        </div>

      </div>

      {/* Timeline List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            Loading timeline events...
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-8">
            {filteredEvents.map((evt, idx) => {
              const dateObj = new Date(evt.timestamp);
              const isSevere = evt.severity === 'severe' || evt.severity === 'emergency';
              const isMod = evt.severity === 'moderate';

              return (
                <div key={evt.id} className="relative group">
                  
                  {/* Timeline Node Dot */}
                  <span className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-white shadow ${
                    isSevere ? 'bg-red-500' : isMod ? 'bg-amber-500' : 'bg-sky-500'
                  }`} />

                  {/* Event Card */}
                  <div className="p-4 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 transition-colors space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold capitalize ${
                          isSevere ? 'bg-red-100 text-red-800' :
                          isMod ? 'bg-amber-100 text-amber-800' :
                          'bg-sky-100 text-sky-800'
                        }`}>
                          {evt.severity}
                        </span>
                        <h3 className="font-bold text-sm text-slate-900">{evt.title}</h3>
                      </div>

                      <span className="text-xs font-mono text-slate-400">
                        {dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {evt.description}
                    </p>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Channels: <strong className="text-slate-700">{evt.modality}</strong></span>
                      <span className="text-slate-400 font-mono">Record ID #{evt.id}</span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 text-slate-400 space-y-2">
            <Clock className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-medium">No timeline events matching current filter criteria.</p>
          </div>
        )}
      </div>

    </div>
  );
}
