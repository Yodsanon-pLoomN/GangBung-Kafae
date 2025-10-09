'use client';

import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { Menu, Recipe, CreateOrderRequest } from '@/lib/data';
import api from '@/lib/api';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface OrderItemWithDetails {
  menuId: number;
  recipeId: number;
  quantity: number;
  menu: Menu;
  recipe: Recipe;
}

interface OrderPanelProps {
  onOrderSuccess?: (orderId: number) => void;
}

// Export interface สำหรับ ref
export interface OrderPanelRef {
  addToOrder: (menuId: number, recipeId: number, quantity: number, menu: Menu, recipe: Recipe) => void;
}

const OrderPanel = forwardRef<OrderPanelRef, OrderPanelProps>(({ onOrderSuccess }, ref) => {
  const [orderItems, setOrderItems] = useState<OrderItemWithDetails[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<number | null>(null);

  // เพิ่มรายการลงตะกร้า
  const addToOrder = (menuId: number, recipeId: number, quantity: number, menu: Menu, recipe: Recipe) => {
    setOrderItems(prev => {
      const existingItemIndex = prev.findIndex(
        item => item.menuId === menuId && item.recipeId === recipeId
      );

      if (existingItemIndex > -1) {
        const newItems = [...prev];
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: newItems[existingItemIndex].quantity + quantity
        };
        return newItems;
      }

      return [...prev, { menuId, recipeId, quantity, menu, recipe }];
    });
  };

  // Expose addToOrder function ผ่าน ref
  useImperativeHandle(ref, () => ({
    addToOrder
  }));

  // ลบรายการออกจากตะกร้า
  const removeFromOrder = (menuId: number, recipeId: number) => {
    setOrderItems(prev => 
      prev.filter(item => !(item.menuId === menuId && item.recipeId === recipeId))
    );
  };

  // อัพเดทจำนวน
  const updateQuantity = (menuId: number, recipeId: number, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromOrder(menuId, recipeId);
      return;
    }

    setOrderItems(prev =>
      prev.map(item =>
        item.menuId === menuId && item.recipeId === recipeId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  // คำนวณราคารวม
  const getTotalPrice = () => {
    return orderItems.reduce((total, item) => total + (item.menu.price * item.quantity), 0);
  };

  // คำนวณจำนวนรายการทั้งหมด
  const getTotalItems = () => {
    return orderItems.reduce((total, item) => total + item.quantity, 0);
  };

  // ส่งออเดอร์ไปยัง API
  const handleCheckout = async () => {
    if (orderItems.length === 0) return;

    setIsSubmitting(true);

    try {
      // จัดกลุ่มรายการตาม menuId
      const groupedItems = orderItems.reduce((acc, item) => {
  const existingItem = acc.find(
    i => i.menuId === item.menuId && i.recipeId === item.recipeId
  );
  if (existingItem) {
    existingItem.quantity += item.quantity;
  } else {
    acc.push({
      menuId: item.menuId,
      recipeId: item.recipeId,
      quantity: item.quantity
    });
  }
  return acc;
}, [] as {
  recipeId: number;
  menuId: number;
  quantity: number;
}[]);

      const requestBody: CreateOrderRequest = {
        orderItems: groupedItems.map(item => ({
          qty: item.quantity,
            menu: {
              id: item.menuId
            },
            recipe: {
              id: item.recipeId
            }

        }))
      };

      console.log('Sending order:', requestBody);

      const response = await api.post('/api/gangbung/order', requestBody);
      
      console.log('Order response:', response.data);

      setLastOrderId(response.data.id);
      setShowSuccessDialog(true);
      setOrderItems([]);

      if (onOrderSuccess && response.data.id) {
        onOrderSuccess(response.data.id);
      }

    } catch (error) {
      console.error('Error creating order:', error);
      alert('ไม่สามารถส่งออเดอร์ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="w-96 bg-white shadow-xl border-l border-gray-200 flex flex-col h-full">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <h3 className="text-sm font-semibold text-blue-100 uppercase tracking-wide mb-2">
            ตะกร้าสินค้า
          </h3>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">รายการสั่งซื้อ</h2>
            {orderItems.length > 0 && (
              <span className="bg-white text-blue-700 text-sm font-bold px-3 py-1 rounded-full">
                {getTotalItems()}
              </span>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {orderItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4 shadow-inner">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <p className="text-gray-600 font-medium text-lg">ตะกร้าว่างเปล่า</p>
              <p className="text-sm text-gray-400 mt-1">เพิ่มเมนูเพื่อเริ่มสั่งซื้อ</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orderItems.map((item, index) => (
                <div 
                  key={`${item.menuId}-${item.recipeId}-${index}`}
                  className="p-4 bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800 text-lg">{item.menu.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          {item.recipe.sweetLevel}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-green-600 mt-2">
                        {item.menu.price.toLocaleString()} บาท/แก้ว
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromOrder(item.menuId, item.recipeId)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Recipe Ingredients */}
                  <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-xs font-semibold text-blue-900 mb-2">ส่วนผสม:</p>
                    <div className="space-y-1">
                      {item.recipe.ingredients.map((ri) => (
                        <div key={ri.id} className="flex justify-between text-xs text-blue-700">
                          <span>• {ri.ingredient.name}</span>
                          <span className="font-medium">{ri.ingredientAmount} {ri.ingredient.unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quantity Control */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 bg-white rounded-lg border-2 border-gray-300 p-1 shadow-sm">
                      <button
                        onClick={() => updateQuantity(item.menuId, item.recipeId, item.quantity - 1)}
                        className="w-9 h-9 flex items-center justify-center hover:bg-red-50 rounded-md transition-colors text-red-600 hover:text-red-700"
                      >
                        <span className="text-xl font-bold">−</span>
                      </button>
                      
                      <span className="text-xl font-bold text-gray-800 min-w-[50px] text-center">
                        {item.quantity}
                      </span>
                      
                      <button
                        onClick={() => updateQuantity(item.menuId, item.recipeId, item.quantity + 1)}
                        className="w-9 h-9 flex items-center justify-center hover:bg-green-50 rounded-md transition-colors text-green-600 hover:text-green-700"
                      >
                        <span className="text-xl font-bold">+</span>
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-gray-500 font-medium">รวม</p>
                      <p className="text-xl font-bold text-gray-800">
                        {(item.menu.price * item.quantity).toLocaleString()} 
                        <span className="text-sm text-gray-600 ml-1">บาท</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Total & Checkout */}
        {orderItems.length > 0 && (
          <div className="p-6 border-t-2 border-gray-200 bg-gradient-to-b from-gray-50 to-white">
            <div className="mb-4 p-5 bg-white rounded-xl border-2 border-gray-200 shadow-md">
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-600 font-medium">จำนวนรายการ</span>
                <span className="font-bold text-gray-800 text-lg">{getTotalItems()} แก้ว</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t-2 border-gray-200">
                <span className="text-xl font-bold text-gray-800">ราคารวมทั้งหมด</span>
                <span className="text-3xl font-bold text-green-600">
                  ฿{getTotalPrice().toLocaleString()}
                </span>
              </div>
            </div>
            <Button
              onClick={handleCheckout}
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-6 rounded-xl transition-all shadow-lg hover:shadow-xl text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2"></div>
                  กำลังดำเนินการ...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  
                  ทำรายการ
                </div>
              )}
            </Button>

            <button
              onClick={() => setOrderItems([])}
              className="w-full mt-3 text-gray-600 hover:text-black font-semibold py-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              ล้างตะกร้า
            </button>
          </div>
        )}
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <DialogTitle className="text-center text-2xl">สั่งซื้อสำเร็จ!</DialogTitle>
            <DialogDescription asChild>
  <div className="text-center mt-4 space-y-2">
    <p className="text-lg">
      เลขที่ออเดอร์: <span className="font-bold text-green-600">#{lastOrderId}</span>
    </p>
    <p className="text-gray-600">ระบบได้รับคำสั่งซื้อของคุณแล้ว</p>
  </div>
</DialogDescription>

          </DialogHeader>
          <div className="flex justify-center mt-6">
            <Button
              onClick={() => setShowSuccessDialog(false)}
              className="bg-green-600 hover:bg-green-700 px-8"
            >
              ตกลง
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});

OrderPanel.displayName = 'OrderPanel';

export default OrderPanel;