import { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Search, Clock, CheckCircle, AlertTriangle, XCircle, Leaf, Trash2 } from 'lucide-react';
import { getDiagnosisHistory, deleteDiagnosis, HistoryDiagnosis } from '../services/api';

const USER_ID_KEY = 'cropguard_user_id';

function parseCropName(diagnosis: string): string {
  const m = diagnosis.match(/(?:Crop|Plant):\s*([^\n\r]+)/i);
  return m ? m[1].trim() : 'Unknown Crop';
}

function parseDiseaseName(diagnosis: string): string {
  const m = diagnosis.match(/(?:Disease|Condition|Anomaly):\s*([^\n\r(]+)/i);
  return m ? m[1].trim() : 'See diagnosis';
}

function getSeverity(status: string, confidence: number): 'Mild' | 'Moderate' | 'Severe' {
  if (status === 'low_confidence' || confidence < 60) return 'Severe';
  if (status === 'needs_review' || confidence < 80) return 'Moderate';
  return 'Mild';
}

function getSeverityVariant(s: string): 'success' | 'warning' | 'danger' {
  if (s === 'Severe') return 'danger';
  if (s === 'Moderate') return 'warning';
  return 'success';
}

interface HistoryListProps {
  userId?: string;
}

export function HistoryList({ userId: propUserId }: HistoryListProps) {
  const [items, setItems] = useState<HistoryDiagnosis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'All' | 'Mild' | 'Moderate' | 'Severe'>('All');

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const userId = propUserId ?? localStorage.getItem(USER_ID_KEY);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    getDiagnosisHistory(userId)
      .then(setItems)
      .catch((e) => setError(e.message ?? 'Failed to load history'))
      .finally(() => setLoading(false));
  }, [userId]);

  async function handleDelete(id: string) {
    try {
      await deleteDiagnosis(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      setToastMessage('Diagnosis deleted successfully');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (e) {
      setToastMessage('Failed to delete diagnosis');
      setTimeout(() => setToastMessage(null), 3000);
    }
  }

  const filtered = items.filter((item) => {
    const crop = parseCropName(item.diagnosis).toLowerCase();
    const disease = parseDiseaseName(item.diagnosis).toLowerCase();
    const q = searchTerm.toLowerCase();
    const matchSearch = !q || crop.includes(q) || disease.includes(q);
    const sev = getSeverity(item.status, item.confidence);
    const matchSev = severityFilter === 'All' || sev === severityFilter;
    return matchSearch && matchSev;
  });

  function StatusIcon({ status }: { status: string }) {
    if (status === 'verified') return <CheckCircle className="w-3.5 h-3.5 text-primary" />;
    if (status === 'needs_review') return <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />;
    return <XCircle className="w-3.5 h-3.5 text-red-400" />;
  }

  function statusLabel(status: string) {
    if (status === 'verified') return 'Verified';
    if (status === 'needs_review') return 'Review Needed';
    return 'Low Confidence';
  }

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-base font-bold text-zinc-950 font-sans tracking-tight">Diagnosis History</h2>
          <p className="text-xs text-zinc-400 font-medium mt-0.5">
            {loading ? 'Loading your scan history...' : `${items.length} total diagnos${items.length === 1 ? 'is' : 'es'}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search crop or disease..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-4 py-2 border border-zinc-200 rounded-xl text-xs bg-zinc-50 focus:outline-none focus:border-primary focus:bg-white transition-all w-44"
            />
          </div>

          {/* Severity filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as any)}
            className="text-xs font-semibold text-zinc-600 bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
          >
            <option value="All">All Severities</option>
            <option value="Mild">Mild</option>
            <option value="Moderate">Moderate</option>
            <option value="Severe">Severe</option>
          </select>
        </div>
      </div>

      {/* Skeleton Loading state */}
      {loading && (
        <div className="flex flex-col gap-4 py-2">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex items-center gap-4 py-4 px-2 animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-zinc-200 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="h-4 bg-zinc-200 rounded w-1/4 mb-2" />
                <div className="h-3 bg-zinc-100 rounded w-1/3" />
              </div>
              <div className="hidden sm:flex flex-col items-end gap-1.5 w-24 shrink-0">
                <div className="h-3 bg-zinc-100 rounded w-12" />
                <div className="h-1.5 bg-zinc-150 rounded w-full" />
              </div>
              <div className="hidden md:block w-20 shrink-0">
                <div className="h-4 bg-zinc-100 rounded-full w-16" />
              </div>
              <div className="w-16 shrink-0">
                <div className="h-3 bg-zinc-100 rounded w-10 ml-auto" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs text-red-600 font-semibold">
          ⚠️ {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Leaf className="w-7 h-7 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-zinc-800">No diagnoses yet</p>
            <p className="text-xs text-zinc-400 font-medium mt-1">Upload a crop photo to start your history</p>
          </div>
        </div>
      )}

      {/* Records grid */}
      {!loading && !error && filtered.length > 0 && (
        <div className="flex flex-col divide-y divide-zinc-100">
          {filtered.map((item) => {
            const crop = parseCropName(item.diagnosis);
            const disease = parseDiseaseName(item.diagnosis);
            const severity = getSeverity(item.status, item.confidence);
            const date = new Date(item.created_at);
            const dateStr = date.toLocaleDateString('en-GB', {
              day: '2-digit', month: 'short', year: 'numeric'
            });
            const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

            return (
              <div
                key={item.id}
                className="flex items-center gap-4 py-4 hover:bg-zinc-50/60 rounded-xl px-2 -mx-2 transition-colors"
              >
                {/* Crop icon */}
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Leaf className="w-5 h-5 text-primary" />
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-bold text-zinc-900 truncate">{crop}</span>
                    <Badge variant={getSeverityVariant(severity)}>{severity}</Badge>
                  </div>
                  <p className="text-xs text-zinc-500 font-medium truncate">{disease}</p>
                </div>

                {/* Confidence bar */}
                <div className="hidden sm:flex flex-col items-end gap-1 w-24 shrink-0">
                  <span className="text-xs font-bold text-zinc-700">{item.confidence}%</span>
                  <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full"
                      style={{ width: `${item.confidence}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-semibold text-zinc-400 uppercase tracking-wider">Confidence</span>
                </div>

                {/* Status */}
                <div className="hidden md:flex items-center gap-1.5 shrink-0">
                  <StatusIcon status={item.status} />
                  <span className="text-[10px] font-semibold text-zinc-500">{statusLabel(item.status)}</span>
                </div>

                {/* Date */}
                <div className="shrink-0 text-right">
                  <div className="flex items-center gap-1 text-[10px] font-semibold text-zinc-400">
                    <Clock className="w-3.5 h-3.5" />
                    {dateStr}
                  </div>
                  <p className="text-[9px] text-zinc-300 mt-0.5">{timeStr}</p>
                </div>

                {/* Delete Action */}
                <div className="shrink-0 pl-2">
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 border border-red-50 hover:bg-red-50/60 rounded-xl text-red-500 hover:text-red-700 transition-colors"
                    title="Delete Record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="py-8 text-center text-zinc-400 text-xs font-medium">
              No records match your filters.
            </div>
          )}
        </div>
      )}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 bg-zinc-950 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 z-50 animate-fade-in border border-zinc-800">
          <span>{toastMessage}</span>
        </div>
      )}
    </Card>
  );
}
