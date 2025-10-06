'use client';

import React from 'react';
import { StockItem } from '@/lib/data';

interface StockListProps {
  stockItems: StockItem[];
}

export default function StockList({ stockItems }: StockListProps) {
  return (
    <div className="p-6 overflow-y-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">สต๊อกสินค้า</h2>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">รายการ</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">สต๊อก</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">ขั้นต่ำ</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {stockItems.map((item) => {
              const isLow = item.stock < item.min * 1.5;
              return (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-800">{item.name}</td>
                  <td className="px-6 py-4 text-right text-gray-700">
                    {item.stock.toLocaleString()} {item.unit}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-500">
                    {item.min.toLocaleString()} {item.unit}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      isLow 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {isLow ? 'ใกล้หมด' : 'ปกติ'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}