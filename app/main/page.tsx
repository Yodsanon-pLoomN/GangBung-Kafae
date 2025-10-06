'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/ui/sidebar';
import MenuList from '@/components/ui/menulist';
import StockList from '@/components/ui/stocklist';
import ItemsSummary from '@/components/itemssummary';
import IngredientPanel from '@/components/ui/ingredientpanel';
import { drinks, stockItems } from '@/lib/data';

export default function Home() {
  const [activeTab, setActiveTab] = useState('menu');
  const [selectedDrink, setSelectedDrink] = useState(drinks[0]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Center Panel */}
        <div className="flex-1">
          {activeTab === 'menu' && (
            <MenuList
              drinks={drinks}
              selectedDrink={selectedDrink}
              onSelectDrink={setSelectedDrink}
            />
          )}

          {activeTab === 'stock' && (
            <StockList stockItems={stockItems} />
          )}

          {activeTab === 'items' && (
            <ItemsSummary
              drinksCount={drinks.length}
              stockItemsCount={stockItems.length}
            />
          )}
        </div>

        {/* Right Panel - Ingredients */}
        <IngredientPanel drink={selectedDrink} />
      </div>
    </div>
  );
}