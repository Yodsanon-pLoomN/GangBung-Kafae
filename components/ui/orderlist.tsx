'use client';

import React from 'react';
import { Drink } from '@/lib/data';
import DrinkCard from './drinkcard';

interface MenuListProps {
  drinks: Drink[];
  selectedDrink: Drink;
  onSelectDrink: (drink: Drink) => void;
}

export default function OrderList({ drinks, selectedDrink, onSelectDrink }: MenuListProps) {
  return (
    <div className="p-6 overflow-y-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">รายการเมนูเครื่องดื่ม</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {drinks.map((drink) => (
          <DrinkCard
            key={drink.id}
            drink={drink}
            isSelected={selectedDrink.id === drink.id}
            onClick={() => onSelectDrink(drink)}
          />
        ))}
      </div>
    </div>
  );
}