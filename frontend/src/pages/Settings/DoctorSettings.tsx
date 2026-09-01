import React, { useState } from 'react';
import { Settings, Sliders, Save, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { showToast } from '../../components/ui/Toast';

export const DoctorSettings: React.FC = () => {
  const { doctor, updateDoctorSettings } = useAuth();
  const [settings, setSettings] = useState({
    paperSize: doctor?.settings?.paperSize || 'A4',
    defaultLanguage: doctor?.settings?.defaultLanguage || 'en',
    defaultFollowUp: doctor?.settings?.defaultFollowUp || '7 days',
    headerVisibility: doctor?.settings?.headerVisibility ?? true,
    footerVisibility: doctor?.settings?.footerVisibility ?? true,
    themeColor: doctor?.settings?.themeColor || '#008ba3',
    showWatermark: doctor?.settings?.showWatermark ?? true,
    showQrCode: doctor?.settings?.showQrCode ?? true,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateDoctorSettings(settings as any);
      showToast.success('Prescription print and layout settings updated.');
    } catch {
      showToast.error('Failed to update settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Prescription & System Settings</h2>
        <p className="text-xs text-slate-500">
          Configure default paper size, QR code verification, watermark, and header layouts
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        {/* Layout & Print Preferences */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
            Print & Layout Preferences
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Default Paper Size
              </label>
              <select
                value={settings.paperSize}
                onChange={(e) => setSettings({ ...settings, paperSize: e.target.value as any })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none"
              >
                <option value="A4">A4 (Standard Full Pad - 210 x 297 mm)</option>
                <option value="Letter">Letter (US / Standard Letter - 216 x 279 mm)</option>
                <option value="A5">A5 (Compact Pad - 148 x 210 mm)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Default Language for Prescriptions
              </label>
              <select
                value={settings.defaultLanguage}
                onChange={(e) => setSettings({ ...settings, defaultLanguage: e.target.value as any })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none"
              >
                <option value="en">English (Rx & Directions in English)</option>
                <option value="bn">বাংলা (Bengali Instructions)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Default Follow-Up Interval
            </label>
            <input
              type="text"
              value={settings.defaultFollowUp}
              onChange={(e) => setSettings({ ...settings, defaultFollowUp: e.target.value })}
              placeholder="e.g. 7 days, 14 days"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-medical-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Prescription Elements Toggle */}
        <div className="space-y-4 pt-2 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-800 pb-2">
            Prescription Pad Elements
          </h3>

          <div className="space-y-3 text-xs font-medium text-slate-700">
            <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100/80 transition-colors">
              <input
                type="checkbox"
                checked={settings.showWatermark}
                onChange={(e) => setSettings({ ...settings, showWatermark: e.target.checked })}
                className="rounded text-medical-600 focus:ring-medical-500"
              />
              <div>
                <p className="font-bold text-slate-800">Prescription Background Watermark</p>
                <p className="text-[11px] text-slate-400">
                  Renders subtle Rx watermark in the center of the prescription pad
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100/80 transition-colors">
              <input
                type="checkbox"
                checked={settings.showQrCode}
                onChange={(e) => setSettings({ ...settings, showQrCode: e.target.checked })}
                className="rounded text-medical-600 focus:ring-medical-500"
              />
              <div>
                <p className="font-bold text-slate-800">Verification QR Code</p>
                <p className="text-[11px] text-slate-400">
                  Embeds a verification QR code linking to the secure online prescription token
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100/80 transition-colors">
              <input
                type="checkbox"
                checked={settings.headerVisibility}
                onChange={(e) => setSettings({ ...settings, headerVisibility: e.target.checked })}
                className="rounded text-medical-600 focus:ring-medical-500"
              />
              <div>
                <p className="font-bold text-slate-800">Doctor & Chamber Header Letterhead</p>
                <p className="text-[11px] text-slate-400">
                  Show doctor name, qualifications, BMDC registration number, and chamber address
                </p>
              </div>
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-medical-600 hover:bg-medical-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" /> Save Prescription Settings
          </button>
        </div>
      </form>
    </div>
  );
};
