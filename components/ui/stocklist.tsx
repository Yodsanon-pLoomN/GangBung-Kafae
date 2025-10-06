'use client';

import React, { useEffect, useState } from 'react';
import { StockItem } from '@/lib/data';
import axios from 'axios';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function StockList() {
  const [items, setItems] = useState<StockItem[] | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    stockQty: '',
    unit: 'ml'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/api/gangbung/ingredients');
        setItems(response.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await axios.post('/api/gangbung/ingredient', {
        name: formData.name,
        stockQty: parseFloat(formData.stockQty),
        unit: formData.unit
      });
      
      // Add new item to list
      if (items) {
        setItems([...items, response.data]);
      } else {
        setItems([response.data]);
      }
      
      // Reset form and close dialog
      setFormData({ name: '', stockQty: '', unit: 'ml' });
      setIsOpen(false);
    } catch (error) {
      console.error('Error adding ingredient:', error);
      alert('เกิดข้อผิดพลาดในการเพิ่มวัตถุดิบ');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleUnitChange = (value: string) => {
    setFormData({
      ...formData,
      unit: value
    });
  };

  return (
    <div className="p-6 overflow-y-auto">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">วัตถุดิบ</h2>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              เพิ่มวัตถุดิบ
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>เพิ่มวัตถุดิบใหม่</DialogTitle>
                <DialogDescription>
                  กรอกข้อมูลวัตถุดิบที่ต้องการเพิ่ม คลิกบันทึกเมื่อเสร็จสิ้น
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-3">
                  <Label htmlFor="name">ชื่อวัตถุดิบ</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="เช่น นม, น้ำตาล"
                    required
                  />
                </div>
                
                <div className="grid gap-3">
                  <Label htmlFor="stockQty">จำนวนสต๊อก</Label>
                  <Input
                    id="stockQty"
                    name="stockQty"
                    type="number"
                    value={formData.stockQty}
                    onChange={handleInputChange}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                
                <div className="grid gap-3">
                  <Label htmlFor="unit">หน่วย</Label>
                  <Select value={formData.unit} onValueChange={handleUnitChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกหน่วย" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ml">มิลลิลิตร (ml)</SelectItem>
                      <SelectItem value="g">กรัม (g)</SelectItem>
                      <SelectItem value="kg">กิโลกรัม (kg)</SelectItem>
                      <SelectItem value="l">ลิตร (l)</SelectItem>
                      <SelectItem value="ชิ้น">ชิ้น</SelectItem>
                      <SelectItem value="ถุง">ถุง</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    ยกเลิก
                  </Button>
                </DialogClose>
                <Button type="submit">บันทึก</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">รายการ</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">สต๊อก</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">หน่วย</th>
            </tr>
          </thead>
          <tbody>
            {items?.map((item) => {
              return (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-800">{item.name}</td>
                  <td className="px-6 py-4 text-right text-gray-700">
                    {item.stockQty.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-700">{item.unit}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}