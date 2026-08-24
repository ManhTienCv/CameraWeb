import React, { useState } from 'react';
import {
  LayoutDashboard,
  FolderTree,
  Package,
  ShoppingCart,
  Settings,
  Star,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import type { Page } from '../../types';

export type AdminTab = 'dashboard' | 'products' | 'categories' | 'orders' | 'reviews' | 'settings';

interface AdminSidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  onNavigate: (page: Page) => void;
  collapsed?: boolean;
  onToggleCollapse?: (collapsed: boolean) => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  setActiveTab,
  onNavigate,
  collapsed: externalCollapsed,
  onToggleCollapse,
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem('admin_sidebar_collapsed');
    return saved === 'true';
  });

  const isCollapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setInternalCollapsed(nextState);
    localStorage.setItem('admin_sidebar_collapsed', String(nextState));
    if (onToggleCollapse) {
      onToggleCollapse(nextState);
    }
  };

  const navItemsSection1 = [
    { id: 'dashboard' as AdminTab, label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'products' as AdminTab, label: 'Sản phẩm', icon: Package },
    { id: 'categories' as AdminTab, label: 'Danh mục', icon: FolderTree },
  ];

  const navItemsSection2 = [
    { id: 'orders' as AdminTab, label: 'Đơn hàng', icon: ShoppingCart },
    { id: 'reviews' as AdminTab, label: 'Đánh giá', icon: Star },
    { id: 'settings' as AdminTab, label: 'Cài đặt', icon: Settings },
  ];

  return (
    <aside
      className={`bg-white text-ink-800 flex flex-col flex-shrink-0 border-r border-cream-200 h-full select-none transition-all duration-300 ease-in-out z-20 ${
        isCollapsed ? 'w-[72px]' : 'w-64'
      }`}
    >
      {/* Top Header - Gemini Style */}
      <div
        className={`flex items-center flex-shrink-0 h-16 border-b border-cream-200/80 transition-all ${
          isCollapsed ? 'justify-center px-3' : 'justify-between px-4'
        }`}
      >
        {/* If Collapsed: Single Top Button with Gemini-style Tooltip */}
        {isCollapsed ? (
          <div className="relative group flex items-center justify-center">
            <button
              onClick={toggleCollapse}
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-ink-700 hover:text-accent-500 hover:bg-cream-100 transition-all active:scale-95 cursor-pointer"
              aria-label="Mở thanh bên"
            >
              <PanelLeftOpen size={22} />
            </button>

            {/* Gemini Floating Pill Tooltip */}
            <div className="absolute left-full ml-3 px-3 py-1.5 bg-ink-900/90 backdrop-blur-xs text-cream-50 text-xs font-semibold rounded-full opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 whitespace-nowrap shadow-lg z-50 transform -translate-y-1/2 top-1/2">
              Mở thanh bên
            </div>
          </div>
        ) : (
          /* If Expanded: Brand Logo + Name + Top-Right Toggle Button */
          <>
            <div className="flex items-center gap-3 overflow-hidden animate-fade-in">
              <div className="w-10 h-10 bg-accent-500 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-xs shrink-0">
                C
              </div>
              <div className="truncate">
                <h1 className="font-display font-bold text-ink-900 text-base leading-tight">CameraHub</h1>
                <span className="text-[10px] font-bold text-accent-600 bg-accent-50 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                  Admin Portal
                </span>
              </div>
            </div>

            <div className="relative group">
              <button
                onClick={toggleCollapse}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-ink-500 hover:text-ink-900 hover:bg-cream-100 transition-all active:scale-95 cursor-pointer shrink-0"
                aria-label="Thu gọn thanh bên"
              >
                <PanelLeftClose size={20} />
              </button>

              {/* Tooltip on Expanded Toggle */}
              <div className="absolute left-full ml-2 px-2.5 py-1 bg-ink-900/90 backdrop-blur-xs text-cream-50 text-[11px] font-semibold rounded-full opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 whitespace-nowrap shadow-md z-50 transform -translate-y-1/2 top-1/2">
                Thu gọn thanh bên
              </div>
            </div>
          </>
        )}
      </div>

      {/* Nav List */}
      <div className={`flex-1 overflow-y-auto space-y-6 ${isCollapsed ? 'px-2 py-4' : 'px-3 py-5'}`}>
        {/* Section 1: Quản lý chung */}
        <div>
          {!isCollapsed && (
            <p className="text-[11px] font-bold text-ink-400 tracking-wider uppercase px-3 mb-2 animate-fade-in">
              QUẢN LÝ CHUNG
            </p>
          )}

          <nav className="space-y-1">
            {navItemsSection1.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <div key={item.id} className="relative group flex items-center">
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center rounded-2xl text-sm font-medium transition-all cursor-pointer ${
                      isCollapsed
                        ? 'w-11 h-11 mx-auto justify-center'
                        : 'w-full gap-3.5 px-3.5 py-2.5'
                    } ${
                      isActive
                        ? 'bg-accent-500 text-white font-semibold shadow-xs'
                        : 'text-ink-700 hover:bg-cream-100 hover:text-ink-900'
                    }`}
                  >
                    <Icon size={20} className="shrink-0" />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </button>

                  {/* Gemini Floating Pill Tooltip when Collapsed */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-3 px-3 py-1.5 bg-ink-900/90 backdrop-blur-xs text-cream-50 text-xs font-semibold rounded-full opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 whitespace-nowrap shadow-lg z-50 transform -translate-y-1/2 top-1/2">
                      {item.label}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Subtle Separator when collapsed, or Section 2 Header when expanded */}
        <div>
          {!isCollapsed ? (
            <p className="text-[11px] font-bold text-ink-400 tracking-wider uppercase px-3 mb-2 animate-fade-in">
              HỆ THỐNG
            </p>
          ) : (
            <div className="w-8 h-[1px] bg-cream-200/80 mx-auto my-3" />
          )}

          <nav className="space-y-1">
            {navItemsSection2.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <div key={item.id} className="relative group flex items-center">
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center rounded-2xl text-sm font-medium transition-all cursor-pointer ${
                      isCollapsed
                        ? 'w-11 h-11 mx-auto justify-center'
                        : 'w-full gap-3.5 px-3.5 py-2.5'
                    } ${
                      isActive
                        ? 'bg-accent-500 text-white font-semibold shadow-xs'
                        : 'text-ink-700 hover:bg-cream-100 hover:text-ink-900'
                    }`}
                  >
                    <Icon size={20} className="shrink-0" />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </button>

                  {/* Gemini Floating Pill Tooltip when Collapsed */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-3 px-3 py-1.5 bg-ink-900/90 backdrop-blur-xs text-cream-50 text-xs font-semibold rounded-full opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 whitespace-nowrap shadow-lg z-50 transform -translate-y-1/2 top-1/2">
                      {item.label}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </div>

      {/* User profile at bottom */}
      <div
        className={`p-3 border-t border-cream-200 flex flex-shrink-0 bg-cream-50/50 transition-all ${
          isCollapsed ? 'flex-col items-center gap-2' : 'items-center justify-between px-4'
        }`}
      >
        <div className="relative group flex items-center gap-3 overflow-hidden">
          <div
            className="w-10 h-10 bg-accent-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0 cursor-pointer"
          >
            A
          </div>
          {!isCollapsed && (
            <div className="truncate animate-fade-in">
              <p className="text-sm font-semibold text-ink-900 truncate">Admin</p>
              <p className="text-[11px] text-ink-400 truncate">admin@camerahub.vn</p>
            </div>
          )}

          {/* Tooltip on collapsed avatar */}
          {isCollapsed && (
            <div className="absolute left-full ml-3 px-3 py-1.5 bg-ink-900/90 backdrop-blur-xs text-cream-50 text-xs font-semibold rounded-full opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 whitespace-nowrap shadow-lg z-50 transform -translate-y-1/2 top-1/2">
              Admin (admin@camerahub.vn)
            </div>
          )}
        </div>

        <div className="relative group">
          <button
            onClick={() => onNavigate({ name: 'home' })}
            className={`text-ink-400 hover:text-ink-900 rounded-xl hover:bg-cream-200/60 transition-colors flex items-center justify-center cursor-pointer ${
              isCollapsed ? 'w-10 h-10' : 'p-2'
            }`}
            aria-label="Quay về trang cửa hàng"
          >
            <LogOut size={18} />
          </button>

          {/* Tooltip on Exit button */}
          <div className="absolute left-full ml-2 px-2.5 py-1 bg-ink-900/90 backdrop-blur-xs text-cream-50 text-[11px] font-semibold rounded-full opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 whitespace-nowrap shadow-md z-50 transform -translate-y-1/2 top-1/2">
            Về trang chủ
          </div>
        </div>
      </div>
    </aside>
  );
};
