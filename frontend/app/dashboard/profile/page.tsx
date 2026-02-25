'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useTranslation';
import { LANGUAGES, SCHEDULED_LANGUAGES } from '@/lib/languages';
import { authAPI } from '@/lib/api';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { t, currentLanguage, changeLanguage } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [selectedLang, setSelectedLang] = useState(currentLanguage);
  const [showAllLangs, setShowAllLangs] = useState(false);

  const displayedLangs = showAllLangs ? LANGUAGES : SCHEDULED_LANGUAGES;

  const handleSave = async () => {
    setSaving(true);
    try {
      await authAPI.updateLanguage(selectedLang);
      await changeLanguage(selectedLang);
      await refreshUser();
      toast.success('Profile updated!');
    } catch {
      toast.error(t('errors.server'));
    } finally {
      setSaving(false);
    }
  };

  const ROLE_BADGE: Record<string, string> = {
    farmer: 'agri-badge-green',
    dealer: 'agri-badge-yellow',
    admin: 'agri-badge-red',
    researcher: 'bg-blue-100 text-blue-800 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium',
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-900">{t('profile.title')}</h1>
      </div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="agri-card"
      >
        <div className="flex items-center gap-5 flex-wrap">
          {user?.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatar}
              alt={user.name}
              className="w-20 h-20 rounded-2xl object-cover border-4 border-primary-100 flex-shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-primary-700 text-white flex items-center justify-center text-3xl font-bold flex-shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold text-primary-900">{user?.name}</h2>
            <p className="text-primary-500 text-sm">{user?.email}</p>
            <div className="mt-1.5 flex items-center gap-2 flex-wrap">
              <span className={ROLE_BADGE[user?.role || 'farmer'] || 'agri-badge-green'}>
                {t(`common.${user?.role}`, user?.role)}
              </span>
              <span className="text-xs text-primary-400">
                Joined {new Date(user?.createdAt || '').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Farmer Profile Details */}
      {user?.role === 'farmer' && user.farmerProfile && (
        <div className="agri-card">
          <h2 className="font-semibold text-primary-900 mb-4">Farmer Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {user.farmerProfile.location?.state && (
              <div>
                <p className="text-primary-500 text-xs font-medium uppercase tracking-wide">
                  {t('profile.state')}
                </p>
                <p className="text-primary-900 font-medium mt-0.5">
                  {user.farmerProfile.location.state}
                </p>
              </div>
            )}
            {user.farmerProfile.location?.district && (
              <div>
                <p className="text-primary-500 text-xs font-medium uppercase tracking-wide">
                  {t('profile.district')}
                </p>
                <p className="text-primary-900 font-medium mt-0.5">
                  {user.farmerProfile.location.district}
                </p>
              </div>
            )}
            {user.farmerProfile.landSize && (
              <div>
                <p className="text-primary-500 text-xs font-medium uppercase tracking-wide">
                  {t('profile.landSize')}
                </p>
                <p className="text-primary-900 font-medium mt-0.5">
                  {user.farmerProfile.landSize} {user.farmerProfile.landUnit || 'acres'}
                </p>
              </div>
            )}
            {user.farmerProfile.primaryCrops && user.farmerProfile.primaryCrops.length > 0 && (
              <div>
                <p className="text-primary-500 text-xs font-medium uppercase tracking-wide">
                  {t('profile.primaryCrops')}
                </p>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {user.farmerProfile.primaryCrops.map((crop) => (
                    <span key={crop} className="agri-badge-green text-xs">
                      🌾 {crop}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Language Preference */}
      <div className="agri-card">
        <h2 className="font-semibold text-primary-900 mb-1">{t('profile.language')}</h2>
        <p className="text-primary-400 text-xs mb-4">
          Vive Code supports 121 Indian languages. Choose your preferred language for AI outputs.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-64 overflow-y-auto pr-1">
          {displayedLangs.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setSelectedLang(lang.code)}
              className={`flex flex-col items-start px-3 py-2.5 rounded-xl border text-left transition-all text-sm ${
                selectedLang === lang.code
                  ? 'bg-primary-700 text-white border-primary-700 font-semibold'
                  : 'bg-white border-primary-200 text-primary-700 hover:border-primary-400'
              }`}
            >
              <span className="font-medium leading-tight">{lang.nativeName}</span>
              <span className={`text-xs ${selectedLang === lang.code ? 'text-primary-200' : 'text-primary-400'}`}>
                {lang.name}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowAllLangs((v) => !v)}
          className="mt-3 text-sm text-primary-600 hover:text-primary-800 font-medium"
        >
          {showAllLangs
            ? 'Show scheduled languages only'
            : `Show all 121 languages (${LANGUAGES.length} available)`}
        </button>
      </div>

      {/* Activity Stats */}
      <div className="agri-card">
        <h2 className="font-semibold text-primary-900 mb-4">{t('profile.activityStats')}</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: t('profile.diseaseChecks'), value: '—', icon: '🔬' },
            { label: t('profile.priceChecks'), value: '—', icon: '📊' },
            { label: t('profile.marketVisits'), value: '—', icon: '🏪' },
          ].map((stat) => (
            <div key={stat.label} className="text-center bg-primary-50 rounded-xl p-3">
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-xl font-bold text-primary-800">{stat.value}</div>
              <div className="text-xs text-primary-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || selectedLang === currentLanguage}
          className="agri-btn-primary flex items-center gap-2"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {t('profile.saving')}
            </>
          ) : (
            `💾 ${t('profile.saveChanges')}`
          )}
        </button>
      </div>
    </div>
  );
}
