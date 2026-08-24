import React from 'react';
import { ExternalLink } from 'lucide-react';
import type { Page } from '../../types';

interface AdminHeaderProps {
  onNavigate: (page: Page) => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onNavigate }) => {
  return (
    <header className="bg-white border-b border-cream-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10 shadow-xs flex-shrink-0">
      <div>
        <h2 className="text-xl font-display font-bold text-ink-900">Bảng Quản Trị</h2>
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={() => onNavigate({ name: 'home' })}
          className="flex items-center gap-2 text-sm font-medium text-ink-700 hover:text-accent-500 border border-cream-300 hover:border-accent-500 px-4 py-2 rounded-xl bg-cream-50 transition-all shadow-xs"
        >
          <ExternalLink size={16} />
          Xem trang chủ
        </button>
      </div>
    </header>
  );
};
