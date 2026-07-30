import React, { useState, useEffect } from 'react';
import { Bookmark, Sparkles, Check, Plus, Trash2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { api } from '../../api/client';
import { showToast } from '../ui/Toast';
import { ITemplate, IPrescriptionMedicine, IPrescriptionChiefComplaint, IPrescriptionDiagnosis } from '../../types';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'apply' | 'save';
  currentPrescriptionData?: {
    chiefComplaints: IPrescriptionChiefComplaint[];
    diagnosis: IPrescriptionDiagnosis[];
    medicines: IPrescriptionMedicine[];
    investigations: string[];
    advice: string[];
    followUpDuration?: string;
  };
  onApplyTemplate: (template: ITemplate) => void;
}

export const TemplateModal: React.FC<TemplateModalProps> = ({
  isOpen,
  onClose,
  mode,
  currentPrescriptionData,
  onApplyTemplate,
}) => {
  const [templates, setTemplates] = useState<ITemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [category, setCategory] = useState('General');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const res = await api<{ success: boolean; data: ITemplate[] }>('/templates');
      if (res.success && res.data) {
        setTemplates(res.data);
      }
    } catch {
      setTemplates([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim()) {
      showToast.error('Please enter a template name.');
      return;
    }

    try {
      const res = await api<{ success: boolean; data: ITemplate }>('/templates', {
        method: 'POST',
        body: JSON.stringify({
          name: templateName.trim(),
          category: category.trim() || 'General',
          description: description.trim() || undefined,
          chiefComplaints: currentPrescriptionData?.chiefComplaints || [],
          diagnosis: currentPrescriptionData?.diagnosis || [],
          medicines: currentPrescriptionData?.medicines || [],
          investigations: currentPrescriptionData?.investigations || [],
          advice: currentPrescriptionData?.advice || [],
          followUpDuration: currentPrescriptionData?.followUpDuration || '7 days',
        }),
      });

      if (res.success) {
        showToast.success('Template saved successfully!');
        setTemplateName('');
        setDescription('');
        onClose();
      }
    } catch (err: any) {
      showToast.error(err.message || 'Failed to save template.');
    }
  };

  const handleDeleteTemplate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this template?')) return;

    try {
      await api(`/templates/${id}`, { method: 'DELETE' });
      setTemplates(templates.filter((t) => t._id !== id));
      showToast.success('Template deleted.');
    } catch (err: any) {
      showToast.error(err.message || 'Failed to delete.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'apply' ? 'Clinical Prescription Templates' : 'Save as New Template'}
      subtitle={
        mode === 'apply'
          ? 'Select a pre-configured template to load into prescription workspace'
          : 'Save current complaints, medicines, and advice for quick re-use'
      }
      maxWidth="max-w-2xl"
    >
      {mode === 'save' ? (
        <form onSubmit={handleSaveTemplate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Template Name *
            </label>
            <input
              type="text"
              required
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g. Acute Tonsillitis Protocol, Dengue Management..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. General, Cardiology, ENT"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Included Items
              </label>
              <p className="text-xs text-slate-500 py-2">
                {currentPrescriptionData?.medicines.length || 0} Meds •{' '}
                {currentPrescriptionData?.investigations.length || 0} Tests •{' '}
                {currentPrescriptionData?.advice.length || 0} Advice
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Description / Clinical Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of when to apply this template..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-medical-600 hover:bg-medical-700 text-white shadow-xs transition-colors"
            >
              Save Template
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-3">
          {isLoading ? (
            <div className="py-8 text-center text-slate-400 text-sm">Loading templates...</div>
          ) : templates.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm space-y-2">
              <p>No saved prescription templates found.</p>
              <p className="text-xs text-slate-400">
                Write a prescription and click "Save as Template" to create one.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-96 overflow-y-auto">
              {templates.map((tpl) => (
                <div
                  key={tpl._id}
                  onClick={() => {
                    onApplyTemplate(tpl);
                    onClose();
                  }}
                  className="p-4 rounded-xl border border-slate-200/80 hover:border-medical-300 hover:bg-medical-50/40 transition-all cursor-pointer space-y-2 group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm group-hover:text-medical-800 transition-colors">
                          {tpl.name}
                        </span>
                        {tpl.category && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold uppercase">
                            {tpl.category}
                          </span>
                        )}
                      </div>
                      {tpl.description && (
                        <p className="text-xs text-slate-500 mt-0.5">{tpl.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => handleDeleteTemplate(tpl._id, e)}
                        className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg hover:bg-white transition-colors"
                        title="Delete Template"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        className="px-3 py-1.5 bg-medical-600 hover:bg-medical-700 text-white rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Apply
                      </button>
                    </div>
                  </div>

                  {/* Summary of items */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                    <span className="font-semibold text-medical-700">
                      {tpl.medicines.length} Medicines:
                    </span>
                    {tpl.medicines.map((m, i) => (
                      <span key={i} className="bg-white px-1.5 py-0.5 rounded border border-slate-200">
                        {m.brandName} ({m.frequency})
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};
