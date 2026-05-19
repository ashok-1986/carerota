"use client";

import { CheckCircle2, Download, UploadCloud, Calendar, Wand2, Loader2 } from 'lucide-react';

interface RotaToolbarProps {
  isDraft: boolean;
  onPublish: () => void;
  onExport: () => void;
  onOpenPatternSetup: () => void;
  onFillFromPattern: () => void;
  isFilling: boolean;
}

export function RotaToolbar({
  isDraft,
  onPublish,
  onExport,
  onOpenPatternSetup,
  onFillFromPattern,
  isFilling,
}: RotaToolbarProps) {
  return (
    <div className="glass-panel rounded-xl px-5 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        {isDraft ? (
          <div className="flex items-center gap-2 bg-warn/10 text-warn border border-warn/20 px-3 py-1.5 rounded-full text-sm font-semibold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-warn" />
            Draft
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-success/10 text-success border border-success/20 px-3 py-1.5 rounded-full text-sm font-semibold">
            <CheckCircle2 size={16} />
            Published
          </div>
        )}

        <button
          onClick={onOpenPatternSetup}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-gold bg-gold/10 border border-gold/20 rounded-full hover:bg-gold/20 transition-all"
        >
          <Calendar size={14} />
          Manage Weekly Templates
        </button>

        {isDraft && (
          <button
            onClick={onFillFromPattern}
            disabled={isFilling}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-teal bg-teal/10 border border-teal/20 rounded-full hover:bg-teal/20 transition-all disabled:opacity-50"
          >
            {isFilling ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Wand2 size={14} />
            )}
            Fill Rota from Patterns
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onExport}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-midnight bg-white border border-slate/20 rounded-lg hover:bg-slate/5 transition-colors shadow-sm"
        >
          <Download size={16} />
          Export
        </button>

        {isDraft && (
          <button
            onClick={onPublish}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-midnight bg-gold rounded-lg hover:bg-gold/90 transition-colors shadow-sm"
          >
            <UploadCloud size={16} />
            Publish Rota
          </button>
        )}
      </div>
    </div>
  );
}