'use client';

import React, { useEffect, useState } from 'react';
import { Order } from '@/lib/data';
import api from '@/lib/api';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get('/api/gangbung/orders');

      const data = Array.isArray(response.data)
        ? response.data
        : (response.data.items || response.data.data || []);

      // Sort by newest first
      const sortedData = data.sort((a: Order, b: Order) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setOrders(sortedData);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('ไม่สามารถโหลดประวัติออเดอร์ได้');
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetail = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const calculateOrderTotal = (order: Order) => {
    return order.orderItems.reduce((total, item) => {
      const price = item.menu?.price || 0;
      return total + (price * item.qty);
    }, 0);
  };

  const getTotalItems = (order: Order) => {
    return order.orderItems.reduce((total, item) => total + item.qty, 0);
  };

  /** ดึง sweetLevel ที่เลือกจริงของรายการ
   * 1) ใช้ item.recipe?.sweetLevel ถ้ามี
   * 2) ถ้าขาด ให้ลองหาใน item.menu?.recipe ด้วย id เดียวกัน
   * 3) ถ้ายังไม่ได้และเมนูมีสูตรเดียว ให้ใช้สูตรนั้น
   * 4) ไม่งั้นคืน '-'
   */
  const getChosenSweetLevel = (item: Order['orderItems'][number]) => {
    if (item.recipe?.sweetLevel) return item.recipe.sweetLevel;


    if (item.menu?.recipe?.length === 1) {
      return item.menu.recipe[0].sweetLevel;
    }

    return '-';
  };

  return (
    <div className="p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">ประวัติออเดอร์</h2>
          <p className="text-sm text-gray-500 mt-1">
            ทั้งหมด {orders.length} รายการ
          </p>
        </div>

        <Button
          onClick={fetchOrders}
          variant="outline"
          className="flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          รีเฟรช
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
            <p>กำลังโหลดประวัติออเดอร์...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={fetchOrders} variant="outline">
              ลองใหม่
            </Button>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-gray-500 text-lg">ยังไม่มีประวัติออเดอร์</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {orders.map((order) => (
              <div
                key={order.id}
                className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => handleViewDetail(order)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                  
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        ออเดอร์ #{order.id}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-gray-500 mb-1">
                      {getTotalItems(order)} รายการ
                    </p>
                    <p className="text-xl font-bold text-green-600">
                      ฿{calculateOrderTotal(order).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Order Items Preview */}
                <div className="mt-3 space-y-1">
                  {order.orderItems.slice(0, 2).map((item) => (
                    <div key={item.id} className="flex justify-between text-sm text-gray-600">
                      <span>
                        {item.menu?.name || 'ไม่ระบุชื่อ'} x {item.qty}
                        {(() => {
                          const level = getChosenSweetLevel(item);
                          return level !== '-' ? ` • ${level}` : '';
                        })()}
                      </span>
                      <span>฿{((item.menu?.price || 0) * item.qty).toLocaleString()}</span>
                    </div>
                  ))}
                  {order.orderItems.length > 2 && (
                    <p className="text-sm text-gray-400">
                      และอีก {order.orderItems.length - 2} รายการ...
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              รายละเอียดออเดอร์ #{selectedOrder?.id}
            </DialogTitle>
            <DialogDescription>
              {selectedOrder && formatDate(selectedOrder.createdAt)}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6 py-4">
              {/* Order Items */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-700 border-b pb-2">
                  รายการสินค้า
                </h3>
                {selectedOrder.orderItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-start p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800">
                        {item.menu?.name || 'ไม่ระบุชื่อ'}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">
                        จำนวน: {item.qty} แก้ว
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        สูตรที่เลือก: <span className="font-medium text-gray-700">{getChosenSweetLevel(item)}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        ฿{(item.menu?.price || 0).toLocaleString()} × {item.qty}
                      </p>
                      <p className="font-semibold text-gray-800 mt-1">
                        ฿{((item.menu?.price || 0) * item.qty).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>จำนวนรายการทั้งหมด</span>
                  <span className="font-medium">{getTotalItems(selectedOrder)} แก้ว</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-lg font-semibold text-gray-800">ยอดรวมทั้งสิ้น</span>
                  <span className="text-2xl font-bold text-green-600">
                    ฿{calculateOrderTotal(selectedOrder).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
