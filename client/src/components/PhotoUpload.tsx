import { useState, useRef } from 'react';
import { diagnosePhoto, DiagnosisResult } from '../services/api';

interface Props {
  userId: string;
  onDiagnosisComplete: (result: DiagnosisResult) => void;
}

export function PhotoUpload({ userId, onDiagnosisComplete }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setError(null);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(selected);
  }

  async function handleSubmit() {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const result = await diagnosePhoto(userId, file);
      onDiagnosisComplete(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Diagnosis failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel">
      <h2>📷 Crop Photo</h2>
      <p className="hint">
        Photograph affected leaves or stems. AI-assisted — not a substitute for an
        extension officer when confidence is low.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="file-input"
      />

      {preview && (
        <div className="preview-wrap">
          <img src={preview} alt="Crop preview" className="preview-img" />
        </div>
      )}

      <button
        type="button"
        className="btn btn-primary"
        disabled={!file || loading}
        onClick={handleSubmit}
      >
        {loading ? 'Analyzing image...' : 'Diagnose Crop'}
      </button>

      {loading && (
        <div className="spinner-wrap">
          <div className="spinner" />
          <span>Analyzing image — this may take a few seconds...</span>
        </div>
      )}

      {error && <p className="error">{error}</p>}
    </section>
  );
}
