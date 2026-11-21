import React, { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { CampaignConfig, DEFAULT_CAMPAIGN_CONFIG } from '../types/fund';
import { BottomSheetModal } from './BottomSheetModal';

interface CampaignSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: CampaignConfig;
  onSaveConfig: (next: CampaignConfig) => void;
}

export const CampaignSettingsModal: React.FC<CampaignSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [title, setTitle] = useState(config.title);
  const [dailyRate, setDailyRate] = useState(String(config.dailyRate));
  const [startDate, setStartDate] = useState(config.startDate);
  const [totalDays, setTotalDays] = useState(String(config.totalDays));

  useEffect(() => {
    if (isOpen) {
      setTitle(config.title);
      setDailyRate(String(config.dailyRate));
      setStartDate(config.startDate);
      setTotalDays(String(config.totalDays));
    }
  }, [isOpen, config]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rate = Math.max(1, Number(dailyRate) || DEFAULT_CAMPAIGN_CONFIG.dailyRate);
    const days = Math.max(1, Number(totalDays) || DEFAULT_CAMPAIGN_CONFIG.totalDays);

    onSaveConfig({
      title: title.trim() || DEFAULT_CAMPAIGN_CONFIG.title,
      dailyRate: rate,
      startDate: startDate || DEFAULT_CAMPAIGN_CONFIG.startDate,
      totalDays: days,
    });
    onClose();
  };

  const handleResetDefaults = () => {
    setTitle(DEFAULT_CAMPAIGN_CONFIG.title);
    setDailyRate(String(DEFAULT_CAMPAIGN_CONFIG.dailyRate));
    setStartDate(DEFAULT_CAMPAIGN_CONFIG.startDate);
    setTotalDays(String(DEFAULT_CAMPAIGN_CONFIG.totalDays));
  };

  return (
    <BottomSheetModal
      isOpen={isOpen}
      onClose={onClose}
      title="ক্যাম্পেইন সেটিংস"
    >
      <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
        <div>
          <label
            htmlFor="cfg-title"
            className="block text-xs font-semibold text-slate-300 mb-1.5"
          >
            প্রজেক্টের নাম *
          </label>
          <input
            id="cfg-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full min-h-[48px] px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="cfg-rate"
              className="block text-xs font-semibold text-slate-300 mb-1.5"
            >
              দৈনিক জমার হার (টাকা) *
            </label>
            <input
              id="cfg-rate"
              type="number"
              inputMode="numeric"
              min="1"
              required
              value={dailyRate}
              onChange={(e) => setDailyRate(e.target.value)}
              className="w-full min-h-[48px] px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 text-sm font-num"
            />
          </div>

          <div>
            <label
              htmlFor="cfg-days"
              className="block text-xs font-semibold text-slate-300 mb-1.5"
            >
              মোট দিন *
            </label>
            <input
              id="cfg-days"
              type="number"
              inputMode="numeric"
              min="1"
              max="365"
              required
              value={totalDays}
              onChange={(e) => setTotalDays(e.target.value)}
              className="w-full min-h-[48px] px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 text-sm font-num"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="cfg-start"
            className="block text-xs font-semibold text-slate-300 mb-1.5"
          >
            শুরুর তারিখ *
          </label>
          <input
            id="cfg-start"
            type="date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full min-h-[48px] px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 text-sm font-num"
          />
        </div>

        <button
          type="button"
          onClick={handleResetDefaults}
          className="min-h-[40px] px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 inline-flex items-center gap-1.5 touch-manipulation"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>ডিফল্ট সেটিংসে ফিরিয়ে নিন</span>
        </button>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[48px] px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-slate-300 text-sm font-semibold rounded-xl transition touch-manipulation"
          >
            বাতিল
          </button>
          <button
            type="submit"
            className="min-h-[48px] px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white text-sm font-semibold rounded-xl transition touch-manipulation"
          >
            সংরক্ষণ করুন
          </button>
        </div>
      </form>
    </BottomSheetModal>
  );
};
