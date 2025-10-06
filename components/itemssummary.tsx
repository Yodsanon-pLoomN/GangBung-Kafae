'use client';

import React from 'react';

interface ItemsSummaryProps {
  drinksCount: number;
  stockItemsCount: number;
}

export default function ItemsSummary({ drinksCount, stockItemsCount }: ItemsSummaryProps) {
  return (
    <div className="p-6 overflow-y-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">รายการทั้งหมด</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4">เมนูเครื่องดื่ม</h3>
          <p className="text-3xl font-bold text-blue-600">{drinksCount}</p>
          <p className="text-sm text-gray-500 mt-2">รายการ</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4">วัตถุดิบ</h3>
          <p className="text-3xl font-bold text-green-600">{stockItemsCount}</p>
          <p className="text-sm text-gray-500 mt-2">รายการ</p>
        </div>
      </div>
    </div>
  );
}