import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { SparklesIcon, ArrowPathIcon, CalendarIcon } from '@heroicons/react/24/outline';

const parseMarkdown = (text) => {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^### (.*$)/gm, '<h3 style="font-weight:600;margin:1rem 0 0.4rem;color:#374151">$1</h3>')
    .replace(/^\* (.*$)/gm, '<li>$1</li>')
    .replace(/^- (.*$)/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>');
};

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data } = await analyticsAPI.getReports();
      setReports(data.reports);
      if (data.reports.length > 0 && !selectedReport) {
        setSelectedReport(data.reports[0]);
      }
    } catch { toast.error('Failed to load reports'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReports(); }, []);

  const generateReport = async () => {
    setGenerating(true);
    try {
      const { data } = await analyticsAPI.generateReport();
      toast.success('Report generated!');
      await fetchReports();
      setSelectedReport(data.report);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate report');
    } finally { setGenerating(false); }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

  return (
    <div className="space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Reports</h1>
          <p className="text-sm text-gray-500">Weekly AI-generated insights powered by Claude</p>
        </div>
        <button onClick={generateReport} disabled={generating} className="btn-primary flex items-center gap-2">
          {generating ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <SparklesIcon className="w-4 h-4" />}
          {generating ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
        </div>
      ) : reports.length === 0 ? (
        <div className="card text-center py-16">
          <SparklesIcon className="w-12 h-12 mx-auto mb-4 text-gray-200" />
          <h3 className="font-medium text-gray-600 mb-2">No reports yet</h3>
          <p className="text-sm text-gray-400 mb-4">Generate your first AI-powered weekly report</p>
          <button onClick={generateReport} disabled={generating} className="btn-primary">
            {generating ? 'Generating...' : 'Generate First Report'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Report list */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Reports</h3>
            {reports.map(report => (
              <button
                key={report._id}
                onClick={() => setSelectedReport(report)}
                className={`w-full text-left card p-4 transition-all cursor-pointer hover:shadow-md ${selectedReport?._id === report._id ? 'border-2' : ''}`}
                style={selectedReport?._id === report._id ? { borderColor: 'var(--color-primary)' } : {}}
              >
                <div className="flex items-center gap-2 mb-1">
                  <CalendarIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">
                    {formatDate(report.weekStartDate)}
                  </span>
                </div>
                <div className="text-xs text-gray-500">to {formatDate(report.weekEndDate)}</div>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`badge text-xs ${report.status === 'completed' ? 'bg-green-100 text-green-700' : report.status === 'processing' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                    {report.status}
                  </span>
                  {report.metrics && (
                    <span className="text-xs text-gray-400">{report.metrics.totalActions ?? 0} actions</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Report detail */}
          <div className="lg:col-span-2">
            {selectedReport ? (
              <div className="card">
                <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <SparklesIcon className="w-5 h-5 text-indigo-500" />
                      <h2 className="font-semibold text-gray-900">Weekly Report</h2>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {formatDate(selectedReport.weekStartDate)} – {formatDate(selectedReport.weekEndDate)}
                    </p>
                  </div>
                  {selectedReport.aiInsightsGeneratedAt && (
                    <span className="text-xs text-gray-400">
                      Generated {formatDate(selectedReport.aiInsightsGeneratedAt)}
                    </span>
                  )}
                </div>

                {/* Metrics summary */}
                {selectedReport.metrics && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                    {[
                      { label: 'Logins', value: selectedReport.metrics.totalLogins },
                      { label: 'Active Users', value: selectedReport.metrics.uniqueUsers },
                      { label: 'Total Actions', value: selectedReport.metrics.totalActions },
                      { label: 'New Users', value: selectedReport.metrics.newUsers },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-gray-50 rounded-lg p-3 text-center">
                        <div className="text-xl font-bold text-gray-900">{value ?? 0}</div>
                        <div className="text-xs text-gray-500">{label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* AI insights */}
                {selectedReport.aiInsights ? (
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <SparklesIcon className="w-4 h-4 text-indigo-500" />
                      <span className="text-sm font-semibold text-indigo-700">AI Analysis</span>
                    </div>
                    <div
                      className="prose text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: parseMarkdown(selectedReport.aiInsights) }}
                    />
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <p className="text-sm">No AI insights available for this report</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="card flex items-center justify-center h-48 text-gray-400">
                Select a report to view
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
