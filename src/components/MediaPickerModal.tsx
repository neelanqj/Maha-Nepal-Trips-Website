import React, { useState, useEffect } from 'react';
import { X, Upload, Check, Trash2, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import type { MediaItem } from '../types/index.ts';
import { useToast } from '../context/ToastContext.tsx';

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: MediaItem) => void;
  title?: string;
  allowUpload?: boolean;
}

export const MediaPickerModal: React.FC<MediaPickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  title = 'Select Image from Media Library',
  allowUpload = true
}) => {
  const { toast, success, error } = useToast();
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [focalX, setFocalX] = useState(0.5);
  const [focalY, setFocalY] = useState(0.5);

  const fetchMedia = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/media');
      if (res.ok) {
        const data = await res.json();
        setMediaList(data.media || []);
      }
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMedia();
    }
  }, [isOpen]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = localStorage.getItem('mnt_auth_token');
    const formData = new FormData();
    formData.append('image', file);
    formData.append('alt_text', file.name.replace(/\.[^/.]+$/, ''));
    formData.append('focal_point_x', String(focalX));
    formData.append('focal_point_y', String(focalY));

    setIsUploading(true);
    try {
      const res = await fetch('/api/media/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        success('Image uploaded to Media Library!');
        await fetchMedia();
        setSelectedId(data.media.id);
      } else {
        const err = await res.json();
        error(err.error || 'Failed to upload image');
      }
    } catch {
      error('Network error during upload');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (item: MediaItem) => {
    if (!confirm(`Are you sure you want to delete "${item.original_name}"?`)) return;

    const token = localStorage.getItem('mnt_auth_token');
    try {
      const res = await fetch(`/api/media/${item.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        success('Image deleted from library.');
        if (selectedId === item.id) setSelectedId(null);
        await fetchMedia();
      } else {
        const err = await res.json();
        error(err.error || 'Cannot delete image.');
      }
    } catch {
      error('Failed to delete image');
    }
  };

  if (!isOpen) return null;

  const currentSelected = mediaList.find((m) => m.id === selectedId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <ImageIcon className="w-5 h-5 text-red-500" />
            <h3 className="text-base sm:text-lg font-bold text-white">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action bar with Upload */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-900 flex items-center justify-between gap-4">
          <div className="text-xs text-slate-400">
            {mediaList.length} media items stored • Reusable across tours and hero banner
          </div>

          {allowUpload && (
            <label className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs cursor-pointer shadow-md transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>{isUploading ? 'Uploading...' : 'Upload New Image'}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/svg+xml"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Media Grid & Preview Area */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Grid: Images */}
          <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {isLoading ? (
              <div className="col-span-full py-12 text-center text-slate-400 text-sm">
                Loading media library...
              </div>
            ) : mediaList.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 text-sm">
                No images uploaded yet. Click Upload New Image to add photographs.
              </div>
            ) : (
              mediaList.map((item) => {
                const isChosen = item.id === selectedId;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                      isChosen
                        ? 'border-red-500 ring-2 ring-red-500/40 shadow-lg'
                        : 'border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <img
                      src={item.url}
                      alt={item.alt_text}
                      className="w-full h-full object-cover"
                    />
                    {isChosen && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 p-1.5 bg-slate-950/80 text-[10px] text-white truncate">
                      {item.original_name}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Panel: Selected Details & Focal Point */}
          <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800 flex flex-col justify-between">
            {currentSelected ? (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white border-b border-slate-800 pb-2">
                  Image Details
                </h4>

                <div className="aspect-[4/3] rounded-lg overflow-hidden border border-slate-700 relative">
                  <img
                    src={currentSelected.url}
                    alt={currentSelected.alt_text}
                    className="w-full h-full object-cover"
                  />
                  {/* Focal point indicator */}
                  <div
                    className="absolute w-4 h-4 -ml-2 -mt-2 rounded-full border-2 border-white bg-red-600 shadow-md pointer-events-none"
                    style={{
                      left: `${(currentSelected.focal_point_x ?? 0.5) * 100}%`,
                      top: `${(currentSelected.focal_point_y ?? 0.5) * 100}%`
                    }}
                  />
                </div>

                <div className="space-y-1.5 text-xs text-slate-300">
                  <div>
                    <span className="text-slate-500">File:</span> {currentSelected.original_name}
                  </div>
                  <div>
                    <span className="text-slate-500">Size:</span> {(currentSelected.size_bytes / 1024).toFixed(1)} KB
                  </div>
                  <div>
                    <span className="text-slate-500">Alt text:</span> {currentSelected.alt_text}
                  </div>
                  {currentSelected.caption && (
                    <div>
                      <span className="text-slate-500">Caption:</span> {currentSelected.caption}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(currentSelected)}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-500/30 text-xs font-semibold transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Image</span>
                </button>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-center p-6 text-xs text-slate-500">
                Select an image on the left to view details or choose it.
              </div>
            )}

            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!currentSelected}
                onClick={() => {
                  if (currentSelected) {
                    onSelect(currentSelected);
                    onClose();
                  }
                }}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold transition-colors shadow-md"
              >
                Use This Image
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
