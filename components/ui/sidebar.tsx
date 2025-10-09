'use client';

import React from 'react';
import { Package, Coffee ,Book,CookingPot} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const menuItems = [
    { id: 'items', label: 'รายการ', icon: Package },
    { id: 'stock', label: 'วัตถุดิบ', icon: CookingPot },
    { id: 'menu', label: 'เมนู', icon: Coffee },
    { id: 'order', label: 'รายการสั่งซื้อ', icon: Book }
  ];

  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-blue-600">GangBung</h1>
        <p className="text-sm text-gray-500 mt-1">Kafae</p>
      </div>
      
      <nav className="p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                activeTab === item.id
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}