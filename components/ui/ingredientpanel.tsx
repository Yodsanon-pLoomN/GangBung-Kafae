'use client';

import React from 'react';
import { Drink } from '@/lib/data';

interface IngredientPanelProps {
  drink: Drink;
}

export default function IngredientPanel({ drink }: IngredientPanelProps) {
  return (
    <div className="w-80 bg-white shadow-lg border-l border-gray-200 p-6 overflow-y-auto">
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
          ส่วนประกอบ
        </h3>
        <h2 className="text-2xl font-bold text-gray-800">{drink.name}</h2>
        <p className="text-sm text-gray-500 mt-1">{drink.category}</p>
      </div>

      <div className="space-y-3">
        {drink.ingredients.map((ingredient, index) => (
          <div 
            key={index}
            className="p-4 bg-blue-50 rounded-lg border border-blue-100"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm font-semibold text-gray-700">
                {ingredient.name}
              </span>
              <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">
                {index + 1}
              </span>
            </div>
            <p className="text-lg font-bold text-blue-700">
              {ingredient.amount} {ingredient.unit}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-gray-100 rounded-lg">
        <p className="text-sm text-gray-600 text-center">
          รวม {drink.ingredients.length} รายการ
        </p>
      </div>
    </div>
  );
}