'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { MdCameraAlt, MdCloudUpload, MdHistory } from 'react-icons/md';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/hooks/useAuth';
import { aiAPI } from '@/lib/api';
import type { CropReport } from '@/types';

const SEVERITY_COLORS: Record<string, string> = {
  low: 'bg-primary-100 text-primary-800 border-primary-200',
  medium: 'bg-accent-100 text-accent-800 border-accent-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  critical: 'bg-red-100 text-red-800 border-red-200',
};

export default function DiseasePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [dragOver, setDragOver] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [cropType, setCropType] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<CropReport | null>(null);
  const [history, setHistory] = useState<CropReport[]>([]);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error(t('errors.invalidImage'));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be smaller than 10MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImagePreview(dataUrl);
      setImageBase64(dataUrl.split(',')[1]);
      setResult(null);
    };
    reader.readAsDataURL(file);
  }, [t]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const analyze = async () => {
    if (!imageBase64) {
      toast.error('Please upload an image first');
      return;
    }
    setAnalyzing(true);
    try {
      const res = await aiAPI.analyzeCropDisease({
        imageBase64,
        language: user?.preferredLanguage || 'en',
        cropType: cropType || undefined,
      });
      const report = res.data?.data as CropReport;
      setResult(report);
      setHistory((prev) => [report, ...prev].slice(0, 10));
      toast.success('Analysis complete!');
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        t('errors.server');
      toast.error(errorMsg);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-900">{t('disease.title')}</h1>
        <p className="text-primary-500 text-sm mt-1">{t('disease.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <div className="agri-card space-y-4">
          <h2 className="font-semibold text-primary-900">{t('disease.uploadImage')}</h2>

          {/* Drop Zone */}
          <div
            className={`drop-zone ${dragOver ? 'dragover' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            {imagePreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imagePreview}
                alt="Crop preview"
                className="max-h-48 rounded-xl object-contain"
              />
            ) : (
              <>
                <MdCloudUpload size={48} className="text-primary-300" />
                <p className="text-primary-600 font-medium text-center">
                  {t('disease.dragDrop')}
                </p>
                <p className="text-primary-400 text-xs">{t('disease.supportedFormats')}</p>
              </>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Camera capture */}
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="agri-btn-secondary w-full flex items-center justify-center gap-2"
          >
            <MdCameraAlt size={18} />
            {t('disease.captureCamera')}
          </button>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Crop type */}
          <input
            type="text"
            value={cropType}
            onChange={(e) => setCropType(e.target.value)}
            placeholder={t('disease.cropTypePlaceholder')}
            className="agri-input"
          />

          {/* Analyze Button */}
          <button
            onClick={analyze}
            disabled={!imageBase64 || analyzing}
            className="agri-btn-primary w-full flex items-center justify-center gap-2"
          >
            {analyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t('disease.analyzing')}
              </>
            ) : (
              <>🔬 {t('disease.analyzeButton')}</>
            )}
          </button>
        </div>

        {/* Results Section */}
        <div className="agri-card">
          <h2 className="font-semibold text-primary-900 mb-4">{t('disease.results')}</h2>

          <AnimatePresence mode="wait">
            {!result && !analyzing && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12 text-primary-400"
              >
                <span className="text-6xl block mb-3">🌿</span>
                <p>Upload and analyze a crop image to see results</p>
              </motion.div>
            )}

            {analyzing && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12"
              >
                <div className="text-5xl animate-bounce mb-3">🔬</div>
                <p className="text-primary-600 font-medium">{t('disease.analyzing')}</p>
                <p className="text-primary-400 text-xs mt-1">AI analysis in progress...</p>
              </motion.div>
            )}

            {result && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Disease Name + Confidence */}
                <div className="bg-primary-50 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-primary-500 uppercase tracking-wide">
                        {t('disease.diseaseName')}
                      </p>
                      <p className="text-xl font-bold text-primary-900 mt-0.5">
                        {result.result?.name || t('disease.healthy')}
                      </p>
                      {result.result?.nameLocal && (
                        <p className="text-primary-600 text-sm">{result.result.nameLocal}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-primary-500">{t('disease.confidence')}</p>
                      <p className="text-2xl font-bold text-primary-700">
                        {Math.round(result.result?.confidence * 100)}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Severity Badge */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-primary-500">{t('disease.severity')}:</span>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full border ${
                      SEVERITY_COLORS[result.result?.severity || 'low']
                    }`}
                  >
                    {result.result?.severity?.toUpperCase()}
                  </span>
                </div>

                {/* Treatment */}
                {result.result?.treatment && result.result.treatment.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-primary-800 mb-2">
                      💊 {t('disease.treatment')}
                    </p>
                    <ul className="space-y-1">
                      {result.result.treatment.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-primary-700">
                          <span className="text-primary-400 mt-0.5">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Prevention */}
                {result.result?.prevention && result.result.prevention.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-primary-800 mb-2">
                      🛡️ {t('disease.prevention')}
                    </p>
                    <ul className="space-y-1">
                      {result.result.prevention.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-primary-700">
                          <span className="text-primary-400 mt-0.5">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* AI Explanation */}
                {result.aiAnalysis && (
                  <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                    <p className="text-xs font-semibold text-blue-700 mb-1">🤖 AI Analysis</p>
                    <p className="text-sm text-blue-800 leading-relaxed">{result.aiAnalysis}</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="agri-card">
          <div className="flex items-center gap-2 mb-4">
            <MdHistory size={20} className="text-primary-500" />
            <h2 className="font-semibold text-primary-900">{t('disease.history')}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {history.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 bg-primary-50 rounded-xl border border-primary-100"
              >
                <span className="text-2xl">🌿</span>
                <div className="min-w-0">
                  <p className="font-medium text-primary-900 text-sm truncate">
                    {item.result?.name || 'Healthy'}
                  </p>
                  <p className="text-primary-400 text-xs">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
