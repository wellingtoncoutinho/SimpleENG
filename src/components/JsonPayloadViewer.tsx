import React, { useState } from 'react';
import { X, Copy, Check, Download, Play, AlertCircle } from 'lucide-react';
import { LessonPayload } from '../types/lesson';
import { soundEffects } from '../utils/audio';

interface JsonPayloadViewerProps {
  lesson: LessonPayload | null;
  onClose: () => void;
  onLoadCustomJson: (lesson: LessonPayload) => void;
}

export const JsonPayloadViewer: React.FC<JsonPayloadViewerProps> = ({
  lesson,
  onClose,
  onLoadCustomJson,
}) => {
  const [jsonText, setJsonText] = useState<string>(
    lesson ? JSON.stringify(lesson, null, 2) : ''
  );
  const [copied, setCopied] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonText);
    soundEffects.playTap();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    soundEffects.playTap();
    const blob = new Blob([jsonText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `simpleeng-lesson-${lesson?.moduleMeta.topic.toLowerCase().replace(/\s+/g, '-') || 'export'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePlayFromEditor = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed.moduleMeta || !parsed.exercises || !Array.isArray(parsed.exercises)) {
        throw new Error('Payload must contain moduleMeta and an exercises array.');
      }
      soundEffects.playTap();
      setParseError(null);
      onLoadCustomJson(parsed as LessonPayload);
    } catch (err: any) {
      setParseError(err.message || 'Invalid JSON syntax');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div>
            <h3 className="text-lg font-black text-white">SimpleENG Engine JSON Payload</h3>
            <p className="text-xs text-slate-400">
              Strict pedagogical schema driving TTS, STT, and tactile game mechanics
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* JSON Editor/Viewer Area */}
        <div className="flex-1 p-4 overflow-hidden flex flex-col min-h-0 bg-slate-900">
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            spellCheck={false}
            className="w-full flex-1 p-4 bg-slate-950 text-emerald-400 font-mono text-xs sm:text-sm rounded-2xl border border-slate-800 focus:border-emerald-500 outline-none resize-none overflow-y-auto leading-relaxed"
          />

          {parseError && (
            <div className="mt-3 p-3 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{parseError}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy JSON'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Download File</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handlePlayFromEditor}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-black rounded-xl shadow-[0_3px_0_#059669] transition-all cursor-pointer flex items-center gap-2 uppercase tracking-wider"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Launch This Lesson</span>
          </button>
        </div>
      </div>
    </div>
  );
};
