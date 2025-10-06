'use client';

import React, { useState } from 'react';
import { Drink } from '@/lib/data';

interface CartItem {
  drink: Drink;
  quantity: number;
}

interface CartPanelProps {
  onCheckout?: (items: CartItem[]) => void;
}

export default function CartPanel({ onCheckout }: CartPanelProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const addToCart = (drink: Drink) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.drink.id === drink.id);
      
      if (existingItem) {
        return prev.map(item =>
          item.drink.id === drink.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      
      return [...prev, { drink, quantity: 1 }];
    });
  };

  const removeFromCart = (drinkId: string) => {
    setCartItems(prev => prev.filter(item => item.drink.id !== drinkId));
  };

  const updateQuantity = (drinkId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(drinkId);
      return;
    }
    
    setCartItems(prev =>
      prev.map(item =>
        item.drink.id === drinkId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.drink.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    
    if (onCheckout) {
      onCheckout(cartItems);
    }
    
    // Clear cart after checkout
    setCartItems([]);
  };

  return (
    <div className="w-80 bg-white shadow-lg border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
          ตะกร้าสินค้า
        </h3>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">รายการสั่งซื้อ</h2>
          {cartItems.length > 0 && (
            <span className="bg-blue-600 text-white text-sm font-bold px-3 py-1 rounded-full">
              {getTotalItems()}
            </span>
          )}
        </div>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-6">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">ตะกร้าว่างเปล่า</p>
            <p className="text-sm text-gray-400 mt-1">เพิ่มเมนูเพื่อเริ่มสั่งซื้อ</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cartItems.map((item) => (
              <div 
                key={item.drink.id}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">{item.drink.name}</h4>
                    <p className="text-sm text-gray-500">{item.drink.category}</p>
                    <p className="text-sm font-medium text-blue-600 mt-1">
                      {item.drink.price} บาท
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.drink.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Quantity Control */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-300 p-1">
                    <button
                      onClick={() => updateQuantity(item.drink.id, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded transition-colors"
                    >
                      <span className="text-lg font-bold text-gray-700">−</span>
                    </button>
                    
                    <span className="text-lg font-bold text-gray-800 min-w-[40px] text-center">
                      {item.quantity}
                    </span>
                    
                    <button
                      onClick={() => updateQuantity(item.drink.id, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded transition-colors"
                    >
                      <span className="text-lg font-bold text-gray-700">+</span>
                    </button>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-gray-500">รวม</p>
                    <p className="text-lg font-bold text-gray-800">
                      {(item.drink.price * item.quantity).toLocaleString()} บาท
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer - Total & Checkout */}
      {cartItems.length > 0 && (
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">จำนวนรายการ</span>
              <span className="font-semibold text-gray-800">{getTotalItems()} แก้ว</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="text-lg font-semibold text-gray-800">ราคารวม</span>
              <span className="text-2xl font-bold text-green-600">
                {getTotalPrice().toLocaleString()} บาท
              </span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-lg transition-colors shadow-md hover:shadow-lg"
          >
            ชำระเงิน
          </button>
        </div>
      )}
    </div>
  );
}