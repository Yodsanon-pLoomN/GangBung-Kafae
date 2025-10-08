'use client';

import React, { useState, useRef } from 'react';
import Sidebar from '@/components/ui/sidebar';
import MenuList from '@/components/ui/menulist';
import StockList from '@/components/ui/stocklist';

import OrderList from '@/components/ui/orderlist';
import OrderHistory from '@/components/ui/orderhistory';
import OrderPanel from '@/components/ui/orderpanal';
import { Menu, Recipe } from '@/lib/data';

export default function Home() {
  const [activeTab, setActiveTab] = useState('menu');
  const [selectedDrink, setSelectedDrink] = useState<Menu | null>(null);
  
  // Ref สำหรับเรียกใช้ function ของ OrderPanel
  const orderPanelRef = useRef<{
    addToOrder: (menuId: number, recipeId: number, quantity: number, menu: Menu, recipe: Recipe) => void;
  } | null>(null);

  const handleSelectDrink = (drink: Menu) => {
    setSelectedDrink(drink);
  };

  const handleAddToOrder = (menuId: number, recipeId: number, quantity: number) => {
    console.log('Adding to order:', { menuId, recipeId, quantity });
    
    // หา menu และ recipe
    if (selectedDrink) {
      const recipe = selectedDrink.recipe.find(r => r.id === recipeId);
      
      if (recipe && orderPanelRef.current) {
        orderPanelRef.current.addToOrder(menuId, recipeId, quantity, selectedDrink, recipe);
      }
    }
  };

  const handleOrderSuccess = (orderId: number) => {
    console.log('Order created successfully with ID:', orderId);
    // สามารถเพิ่ม logic เพิ่มเติมได้ เช่น แสดง notification, refresh order history
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Center Panel */}
        <div className="flex-1">
          {activeTab === 'items' && (
            <OrderList 
              selectedDrink={selectedDrink}
              onSelectDrink={handleSelectDrink}
              onAddToOrder={handleAddToOrder}
            />
          )}

          {activeTab === 'stock' && (
            <StockList />
          )}
          
          {activeTab === 'menu' && (
            <MenuList />
          )}
          
          {activeTab === 'order' && (
            <OrderHistory />
          )}
        </div>

        {/* Right Panel - Order Cart (แสดงเฉพาะในหน้า items) */}
        {activeTab === 'items' && (
          <OrderPanel 
            ref={orderPanelRef}
            onOrderSuccess={handleOrderSuccess}
          />
        )}
      </div>
    </div>
  );
}