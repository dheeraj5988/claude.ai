import React from 'react';
import { X } from 'lucide-react';
import { Attachment } from '../types';

interface FileCardProps {
  attachment: Attachment;
  onRemove: (id: string) => void;
}

export const FileCard: React.FC<FileCardProps> = ({ attachment, onRemove }) => {
  // Extract extension, e.g. "MD", "JS", "TS", "PY", "TXT"
  const getExtension = () => {
    const parts = attachment.name.split('.');
    if (parts.length > 1) {
      return parts.pop()?.toUpperCase() || 'FILE';
    }
    return attachment.language?.toUpperCase() || 'FILE';
  };

  // Determine line count or file size display
  const getLineCountDisplay = () => {
    if (attachment.lineCount) {
      return `${attachment.lineCount} ${attachment.lineCount === 1 ? 'line' : 'lines'}`;
    }
    if (attachment.content) {
      const count = attachment.content.split('\n').length;
      return `${count} ${count === 1 ? 'line' : 'lines'}`;
    }
    if (attachment.size) {
      return `${(attachment.size / 1024).toFixed(1)} KB`;
    }
    return '14 lines';
  };

  return (
    <div className="w-[124px] h-[110px] rounded-2xl bg-[#1F1F1E] border border-[#323230] p-3 flex flex-col justify-between relative group select-none transition-all shadow-sm shrink-0">
      {/* Remove Button on Hover */}
      <button
        type="button"
        onClick={e => {
          e.stopPropagation();
          onRemove(attachment.id);
        }}
        className="absolute top-2 right-2 p-1 rounded-full bg-[#2A2A28] text-[#8E8E8B] hover:text-white opacity-0 group-hover:opacity-100 transition cursor-pointer"
        title="Remove file"
      >
        <X className="w-3 h-3" />
      </button>

      {/* Top: File name & line count */}
      <div>
        <div
          className="text-xs font-normal text-[#E6E6E3] line-clamp-2 leading-tight break-all pr-3"
          title={attachment.name}
        >
          {attachment.name}
        </div>
        <div className="text-[11px] text-[#8E8E8B] mt-1">
          {getLineCountDisplay()}
        </div>
      </div>

      {/* Bottom: Extension Pill (MD, JS, TS, etc.) */}
      <div>
        <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-[#2A2A28] text-[#9E9E9C] uppercase inline-block">
          {getExtension()}
        </span>
      </div>
    </div>
  );
};
