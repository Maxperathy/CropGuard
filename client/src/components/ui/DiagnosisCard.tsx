import { Card } from './Card';
import { Badge } from './Badge';
import { Progress } from './Progress';
import { Share2, Download, FileText, CheckCircle } from 'lucide-react';

export interface DiagnosisData {
  id: string;
  cropName: string;
  cropScientific: string;
  diseaseName: string;
  diseaseScientific: string;
  confidence: number;
  severity: 'Mild' | 'Moderate' | 'Severe';
  recommendedAction: string;
  diagnosisDate: string;
  imageUrl?: string;
}

interface DiagnosisCardProps {
  data: DiagnosisData;
  onShare?: () => void;
  onDownloadReport?: () => void;
  onViewImage?: () => void;
}

export function DiagnosisCard({
  data,
  onShare,
  onDownloadReport,
  onViewImage,
}: DiagnosisCardProps) {

  const getSeverityBulletColor = (severity: string) => {
    switch (severity) {
      case 'Severe':
        return 'bg-red-500';
      case 'Moderate':
        return 'bg-amber-500';
      default:
        return 'bg-emerald-500';
    }
  };

  return (
    <Card className="p-0 overflow-hidden border border-zinc-100/80">
      <div className="grid grid-cols-1 md:grid-cols-5">
        {/* Left Side: Photo Thumbnail */}
        <div className="md:col-span-2 relative min-h-48 md:min-h-auto bg-zinc-50 border-r border-zinc-100 flex items-center justify-center overflow-hidden">
          {data.imageUrl ? (
            <img
              src={data.imageUrl}
              alt={data.diseaseName}
              className="w-full h-full object-cover aspect-video md:aspect-auto"
            />
          ) : (
            <div className="text-center p-6 text-zinc-400">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <span className="text-xs">No Specimen Image Available</span>
            </div>
          )}
          {data.imageUrl && onViewImage && (
            <button
              onClick={onViewImage}
              className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-white/90 hover:bg-white backdrop-blur border border-zinc-200/50 rounded-xl text-[10px] font-bold text-zinc-700 shadow-sm transition-all"
            >
              View Full Image
            </button>
          )}
        </div>

        {/* Right Side: Diagnostics Info */}
        <div className="md:col-span-3 p-5 flex flex-col justify-between">
          <div>
            {/* Headers row */}
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100/50">
                🌿 {data.cropName} <span className="text-[8px] font-medium italic opacity-75">({data.cropScientific})</span>
              </span>
              <Badge variant="danger">Disease Detected</Badge>
            </div>

            {/* Disease Details */}
            <h3 className="text-xl font-bold text-zinc-950 tracking-tight leading-none mt-1">
              {data.diseaseName}
            </h3>
            <p className="text-xs text-zinc-400 italic font-semibold mt-0.5">
              {data.diseaseScientific}
            </p>

            {/* Confidence progress and severity metrics */}
            <div className="grid grid-cols-2 gap-4 my-4">
              <div>
                <div className="flex justify-between items-center text-[10px] font-bold mb-1">
                  <span className="text-zinc-500">Confidence</span>
                  <span className="text-zinc-900">{data.confidence}%</span>
                </div>
                <Progress value={data.confidence} barClassName="bg-primary" />
              </div>

              <div>
                <span className="text-[10px] font-bold text-zinc-500 block mb-1">Severity</span>
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${getSeverityBulletColor(data.severity)}`} />
                  <span className="text-xs font-bold text-zinc-800">{data.severity}</span>
                </div>
              </div>
            </div>

            {/* Recommended action alert bubble */}
            <div className="bg-emerald-50/50 border border-emerald-100/75 rounded-2xl p-3 flex items-start gap-2.5 mb-4">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-[11px] text-zinc-700 leading-normal">
                <span className="font-bold text-emerald-800 block">Recommended Action</span>
                <p className="mt-0.5 font-medium">{data.recommendedAction}</p>
              </div>
            </div>
          </div>

          {/* Footer date and sharing panel */}
          <div className="flex items-center justify-between border-t border-zinc-100 pt-3 text-[10px] font-bold text-zinc-400 shrink-0">
            <span>Diagnosed on {data.diagnosisDate}</span>
            <div className="flex gap-2">
              <button
                onClick={onShare}
                className="flex items-center gap-1 hover:text-zinc-700 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
              <button
                onClick={onDownloadReport}
                className="flex items-center gap-1 hover:text-zinc-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Report</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
