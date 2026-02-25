'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MdDashboard,
  MdBiotech,
  MdShowChart,
  MdStorefront,
  MdPeople,
  MdNewspaper,
  MdSatelliteAlt,
  MdPerson,
  MdClose,
} from 'react-icons/md';
import { useTranslation } from '@/hooks/useTranslation';

interface SidebarProps {
  collapsed?: boolean;
  onClose?: () => void;
}

const NAV_ITEMS = [
  { key: 'dashboard', href: '/dashboard', icon: MdDashboard },
  { key: 'disease', href: '/dashboard/disease', icon: MdBiotech },
  { key: 'prices', href: '/dashboard/prices', icon: MdShowChart },
  { key: 'markets', href: '/dashboard/markets', icon: MdStorefront },
  { key: 'dealers', href: '/dashboard/dealers', icon: MdPeople },
  { key: 'news', href: '/dashboard/news', icon: MdNewspaper },
  { key: 'satellite', href: '/dashboard/satellite', icon: MdSatelliteAlt },
  { key: 'profile', href: '/dashboard/profile', icon: MdPerson },
];

export default function Sidebar({ collapsed = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <aside className="h-full bg-primary-900 flex flex-col shadow-xl">
      {/* Logo area */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-primary-700/50">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-accent-400/20 rounded-xl flex items-center justify-center text-xl border border-accent-400/30">
              🌾
            </div>
            <div>
              <div className="text-white font-bold text-sm leading-tight">KisanSaathi</div>
              <div className="text-primary-400 text-xs">Bharat</div>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-9 h-9 bg-accent-400/20 rounded-xl flex items-center justify-center text-xl border border-accent-400/30 mx-auto">
            🌾
          </div>
        )}
        {onClose && (
          <button
            onClick={onClose}
            className="text-primary-400 hover:text-white p-1 rounded-lg hover:bg-primary-700/50 transition-colors"
          >
            <MdClose size={20} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.key}
              href={item.href}
              onClick={onClose}
              title={collapsed ? t(`nav.${item.key}`) : undefined}
              className={`sidebar-link ${isActive ? 'active' : ''} ${
                collapsed ? 'justify-center px-2' : ''
              }`}
            >
              <Icon
                size={20}
                className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-primary-400'}`}
              />
              {!collapsed && (
                <span>{t(`nav.${item.key}`)}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer branding */}
      {!collapsed && (
        <div className="px-4 py-4 border-t border-primary-700/50">
          <p className="text-primary-500 text-xs text-center">
            🎯 SDG 2 · Zero Hunger
          </p>
        </div>
      )}
    </aside>
  );
}
