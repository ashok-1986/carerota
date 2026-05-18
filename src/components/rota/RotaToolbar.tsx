import { CheckCircle2, Download, UploadCloud } from 'lucide-react';

interface RotaToolbarProps {
  isDraft: boolean;
  onPublish: () => void;
  onExport: () => void;
}

export function RotaToolbar({ isDraft, onPublish, onExport }: RotaToolbarProps) {
  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-center gap-4">
        {isDraft ? (
          <div className="flex items-center gap-2 bg-warn/10 text-warn border border-warn/20 px-3 py-1.5 rounded-full text-sm font-semibold">
            <span className="w-2 h-2 rounded-full bg-warn animate-pulse" />
            Draft
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-success/10 text-success border border-success/20 px-3 py-1.5 rounded-full text-sm font-semibold">
            <CheckCircle2 size={16} />
            Published
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button 
          onClick={onExport}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate bg-white border border-slate/20 rounded-lg hover:bg-slate/5 transition-colors"
        >
          <Download size={16} />
          Export
        </button>
        
        {isDraft && (
          <button 
            onClick={onPublish}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gold rounded-lg hover:bg-gold/90 transition-colors shadow-sm"
          >
            <UploadCloud size={16} />
            Publish Rota
          </button>
        )}
      </div>
    </div>
  );
}
