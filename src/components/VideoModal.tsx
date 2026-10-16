import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  posterImage?: string;
  title?: string;
}

export const VideoModal: React.FC<VideoModalProps> = ({
  isOpen,
  onClose,
  videoUrl,
  title = "Deepak Kushwaha's Story: Guiding Through the Himalayas"
}) => {
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
      setTimeout(() => closeBtnRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Make sure YouTube URL has parameters like rel=0
  let embedSrc = videoUrl;
  if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
    const separator = videoUrl.includes('?') ? '&' : '?';
    embedSrc = `${videoUrl}${separator}autoplay=1&rel=0&modestbranding=1`;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/60 rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
            <h3 id="video-modal-title" className="text-sm sm:text-base font-semibold text-white tracking-wide">
              {title}
            </h3>
          </div>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            aria-label="Close video player"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Responsive Video Frame */}
        <div className="relative aspect-video w-full bg-black">
          <iframe
            src={embedSrc}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full border-0"
          />
        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-950/80 text-xs sm:text-sm text-slate-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-t border-slate-800">
          <span>Guided by Deepak Kushwaha • Maha Nepal Trips</span>
          <span className="text-slate-500">Press Escape or click outside to close</span>
        </div>
      </div>
    </div>
  );
};
