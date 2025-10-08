'use client';

import React from 'react';
import { Coffee, ChevronRight } from 'lucide-react';
import { Menu } from '@/lib/data';

interface DrinkCardProps {
  drink: Menu;
  isSelected: boolean;
  onClick: () => void;
}

export default function DrinkCard({ drink, isSelected, onClick }: DrinkCardProps) {
  return (
    <button
      onClick={onClick}
      className={`p-6 rounded-xl border-2 text-left transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50 shadow-md'
          : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow'
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-bold text-gray-800">{drink.name}</h3>
        <Coffee size={24} className="text-blue-500" />
      </div>
      
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl font-bold text-green-600">฿{drink.price}</span>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {drink.recipe.length} สูตร
        </span>
      </div>
      
      <div className="mt-3 flex items-center text-sm text-blue-600 font-medium">
        <span>เลือกเมนูนี้</span>
        <ChevronRight size={16} className="ml-1" />
      </div>
    </button>
  );
}