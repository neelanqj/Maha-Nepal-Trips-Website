import React from 'react';
import { ExternalLink, Star, ShieldCheck, AlertCircle } from 'lucide-react';
import type { ViatorWidgetContent } from '../types/index.ts';

interface ViatorWidgetProps {
  config?: ViatorWidgetContent | null;
  tourTitle?: string;
  isPreviewMode?: boolean;
}

export const ViatorWidget: React.FC<ViatorWidgetProps> = ({ config, tourTitle, isPreviewMode = false }) => {
  const isEnabled = config?.enabled === true;
  const hasEmbed = Boolean(config?.embed_code?.trim() || config?.widget_url?.trim());

  // If on public site and not configured/enabled, hide completely
  if (!isEnabled && !isPreviewMode) {
    return null;
  }

  return (
    <div className="w-full rounded-2xl bg-slate-900/80 border border-slate-800 p-6 sm:p-8 backdrop-blur-md">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Verified Traveler Feedback
            </span>
          </div>
          <h3 className="text-xl font-bold text-white mt-1">
            {tourTitle ? `Independent Reviews for ${tourTitle}` : 'Viator & TripAdvisor Verified Traveler Reviews'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Independent, authenticated traveler reviews from TripAdvisor & Viator platform
          </p>
        </div>

        {/* Source attribution badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700/80 text-xs font-semibold text-slate-300">
          <span>Source:</span>
          <span className="text-white font-bold tracking-wide">Viator / TripAdvisor</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>

      {/* Actual Embed vs Placeholder */}
      <div className="mt-6">
        {isEnabled && hasEmbed ? (
          <div>
            {config?.widget_url ? (
              <iframe
                src={config.widget_url}
                title="Viator Verified Reviews"
                className="w-full min-h-[350px] rounded-xl border border-slate-700 bg-white"
                sandbox="allow-scripts allow-same-origin"
              />
            ) : (
              <div
                dangerouslySetInnerHTML={{ __html: config?.embed_code || '' }}
                className="w-full min-h-[200px]"
              />
            )}
          </div>
        ) : (
          /* Labeled Preview Placeholder (No invented reviews, no fake stars or counts) */
          <div className="p-8 sm:p-12 rounded-xl border border-dashed border-slate-700 bg-slate-950/60 text-center">
            <div className="inline-flex p-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-slate-400 mb-4">
              <Star className="w-6 h-6 text-amber-400" />
            </div>
            <h4 className="text-base sm:text-lg font-bold text-white mb-2">
              Viator Reviews Widget Placeholder
            </h4>
            <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
              This area is reserved for your official Viator or TripAdvisor authorized reviews embed. In accordance with platform integrity, no synthetic reviews or invented ratings are displayed.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Configure your official embed code in Admin Dashboard → Site Content → Viator Widget</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
