import React, { useState, useEffect } from 'react';
import { Bookmark, Plus, Trash2, Edit2, Sparkles, Check } from 'lucide-react';
import { api } from '../../api/client';
import { showToast } from '../../components/ui/Toast';
import { ITemplate } from '../../types';

export const TemplateList: React.FC = () => {
  const [templates, setTemplates] = useState<ITemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const res = await api<{ success: boolean; data: ITemplate[] }>('/templates');
      if (res.success && res.data) {
        setTemplates(res.data);
      }
    } catch {
      showToast.error('Failed to load templates.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;

    try {
      await api(`/templates/${id}`, { method: 'DELETE' });
      setTemplates(templates.filter((t) => t._id !== id));
      showToast.success('Template deleted.');
    } catch {
      showToast.error('Failed to delete template.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Clinical Prescription Templates</h2>
          <p className="text-xs text-slate-500">
            Re-usable protocols for fever, asthma, gastritis, diabetes, and hypertension
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-slate-400">Loading templates...</div>
      ) : templates.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 space-y-2">
          <p>No saved prescription templates yet.</p>
          <p className="text-xs">
            Open the prescription editor and click "Save as Template" to build your protocol library.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((tpl) => (
            <div
              key={tpl._id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4 hover:border-medical-300 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base group-hover:text-medical-700 transition-colors">
                      {tpl.name}
                    </h3>
                    {tpl.category && (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase mt-1 inline-block">
                        {tpl.category}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(tpl._id)}
                    className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg hover:bg-slate-50 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {tpl.description && (
                  <p className="text-xs text-slate-500 leading-relaxed">{tpl.description}</p>
                )}

                {/* Medicines preview */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {tpl.medicines.length} Medicines Prescribed
                  </span>
                  <div className="space-y-1">
                    {tpl.medicines.map((m: any, i: number) => (
                      <p key={i} className="text-slate-800 font-medium truncate">
                        • <span className="font-bold">{m.brandName}</span> ({m.frequency})
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
                <span>Follow-up: {tpl.followUpDuration || '7 days'}</span>
                <span className="text-[11px] text-medical-600 font-semibold">Ready to apply</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
