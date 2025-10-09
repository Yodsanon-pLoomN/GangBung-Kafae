'use client';

import React, { useEffect, useState } from 'react';
import { Ingredient, CreateIngredientRequest } from '@/lib/data';
import api from '@/lib/api';
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
  const [items, setItems] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add dialog
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', stockQty: '', unit: 'ml', location: '' });

  // Refill dialog
  const [isRefillOpen, setIsRefillOpen] = useState(false);
  const [refillTarget, setRefillTarget] = useState<Ingredient | null>(null);
  const [refillAmount, setRefillAmount] = useState<string>('0');
  const [isRefilling, setIsRefilling] = useState(false);

  // Edit dialog
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Ingredient | null>(null);
  const [editForm, setEditForm] = useState({ name: '', stockQty: '', unit: 'ml', location: '' });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete dialog
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Ingredient | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    refresh();
  }, []);

  const refresh = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/gangbung/ingredients');
      const data = Array.isArray(response.data)
        ? response.data
        : (response.data.items || response.data.data || []);
      setItems(data);
    } catch (e) {
      console.error(e);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  /* ---------------- Add (POST) ---------------- */
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: CreateIngredientRequest = {
        name: addForm.name.trim(),
        stockQty: parseFloat(addForm.stockQty || '0'),
        unit: addForm.unit,
      };
      if (addForm.location.trim()) {
        payload.location = { location: addForm.location.trim() };
      }

      const res = await api.post('/api/gangbung/ingredient', payload);
      const newItem: Ingredient = Array.isArray(res.data) ? res.data[0] : res.data;
      setItems(prev => [...prev, newItem]);

      setAddForm({ name: '', stockQty: '', unit: 'ml', location: '' });
      setIsAddOpen(false);
    } catch (e) {
      console.error(e);
      alert('เกิดข้อผิดพลาดในการเพิ่มวัตถุดิบ');
    }
  };

  /* ---------------- Refill (PUT) ---------------- */
  const openRefill = (ing: Ingredient) => {
    setRefillTarget(ing);
    setRefillAmount('0');
    setIsRefillOpen(true);
  };

  const quickAdd = (n: number) => {
    setRefillAmount(v => String(parseFloat(v || '0') + n));
  };

  const confirmRefill = async () => {
    if (!refillTarget) return;
    const add = parseFloat(refillAmount || '0');
    if (isNaN(add) || add <= 0) {
      alert('กรุณากรอกจำนวนที่จะเติม (> 0)');
      return;
    }

    const updated: Ingredient = {
      ...refillTarget,
      stockQty: (refillTarget.stockQty || 0) + add,
    };

    setIsRefilling(true);
    try {
      const res = await api.put(`/api/gangbung/ingredient/${refillTarget.id}`, updated);
      const saved: Ingredient = Array.isArray(res.data) ? res.data[0] : res.data;
      setItems(prev => prev.map(i => (i.id === saved.id ? saved : i)));
      setIsRefillOpen(false);
      setRefillTarget(null);
      setRefillAmount('0');
    } catch (e) {
      console.error('Refill failed', e);
      alert('เติมสต๊อกไม่สำเร็จ');
    } finally {
      setIsRefilling(false);
    }
  };

  /* ---------------- Edit (PUT) ---------------- */
  const openEdit = (ing: Ingredient) => {
    setEditTarget(ing);
    setEditForm({
      name: ing.name,
      stockQty: String(ing.stockQty ?? 0),
      unit: ing.unit,
      location: ing.location?.location || '',
    });
    setIsEditOpen(true);
  };

  const confirmEdit = async () => {
    if (!editTarget) return;

    const stock = parseFloat(editForm.stockQty || '0');
    if (!editForm.name.trim()) return alert('กรุณากรอกชื่อวัตถุดิบ');
    if (isNaN(stock) || stock < 0) return alert('จำนวนสต๊อกต้องเป็นตัวเลขและไม่ติดลบ');

    const payload: Ingredient = {
      id: editTarget.id,
      name: editForm.name.trim(),
      stockQty: stock,
      unit: editForm.unit,
      location: editForm.location.trim()
        ? { id: editTarget.location?.id ?? 0, location: editForm.location.trim() }
        : null,
    };

    setIsSavingEdit(true);
    try {
      const res = await api.put(`/api/gangbung/ingredient/${editTarget.id}`, payload);
      const saved: Ingredient = Array.isArray(res.data) ? res.data[0] : res.data;
      setItems(prev => prev.map(i => (i.id === saved.id ? saved : i)));
      setIsEditOpen(false);
      setEditTarget(null);
    } catch (e) {
      console.error('Edit failed', e);
      alert('แก้ไขวัตถุดิบไม่สำเร็จ');
    } finally {
      setIsSavingEdit(false);
    }
  };

  /* ---------------- Delete (DELETE) ---------------- */
  const openDelete = (ing: Ingredient) => {
    setDeleteTarget(ing);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/gangbung/ingredient/${deleteTarget.id}`);
      setItems(prev => prev.filter(i => i.id !== deleteTarget.id));
      setIsDeleteOpen(false);
      setDeleteTarget(null);
    } catch (e) {
      console.error('Delete failed', e);
      alert('ลบวัตถุดิบไม่สำเร็จ');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">วัตถุดิบ</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refresh}>รีเฟรช</Button>
          {/* Add Ingredient */}
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                เพิ่มวัตถุดิบ
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
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
                    value={addForm.name}
                    onChange={(e) => setAddForm(s => ({ ...s, name: e.target.value }))}
                    placeholder="เช่น นม, น้ำตาล"
                  />
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="stockQty">จำนวนสต๊อก</Label>
                  <Input
                    id="stockQty"
                    name="stockQty"
                    type="number"
                    value={addForm.stockQty}
                    onChange={(e) => setAddForm(s => ({ ...s, stockQty: e.target.value }))}
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="unit">หน่วย</Label>
                  <Select value={addForm.unit} onValueChange={(v) => setAddForm(s => ({ ...s, unit: v }))}>
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

                <div className="grid gap-3">
                  <Label htmlFor="location">ตำแหน่งเก็บ (ไม่บังคับ)</Label>
                  <Input
                    id="location"
                    name="location"
                    value={addForm.location}
                    onChange={(e) => setAddForm(s => ({ ...s, location: e.target.value }))}
                    placeholder="เช่น ตู้เย็น, ชั้นวาง"
                  />
                </div>
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">ยกเลิก</Button>
                </DialogClose>
                <Button onClick={handleAddSubmit}>บันทึก</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">กำลังโหลด...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-gray-500">ไม่มีข้อมูลวัตถุดิบ</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">รายการ</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">สต๊อก</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">หน่วย</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">ตำแหน่งเก็บ</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-800">{item.name}</td>
                  <td className="px-6 py-4 text-right text-gray-700">
                    {item.stockQty.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-center text-gray-700">{item.unit}</td>
                  <td className="px-6 py-4 text-center text-gray-600">
                    {item.location ? item.location.location : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      {/* เติม */}
                      <Button
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => openRefill(item)}
                      >
                        เติม
                      </Button>

                      {/* แก้ไข */}
                      <Button
                        variant="secondary"
                        onClick={() => openEdit(item)}
                      >
                        แก้ไข
                      </Button>

                      {/* ลบ */}
                      <Button
                        variant="destructive"
                        onClick={() => openDelete(item)}
                      >
                        ลบ
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Refill Dialog */}
      <Dialog open={isRefillOpen} onOpenChange={setIsRefillOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-2xl">เติมสต๊อก</DialogTitle>
            <DialogDescription>ระบุจำนวนที่ต้องการเติมให้กับวัตถุดิบ</DialogDescription>
          </DialogHeader>

          {refillTarget && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-blue-50 text-sm text-blue-900">
                <div className="font-semibold">{refillTarget.name}</div>
                <div className="mt-1">
                  คงเหลือปัจจุบัน: <b>{refillTarget.stockQty.toLocaleString()} {refillTarget.unit}</b>
                  {refillTarget.location ? ` • ${refillTarget.location.location}` : ''}
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="refillAmount">จำนวนที่จะเติม ({refillTarget.unit})</Label>
                <div className="flex gap-2">
                  <Input
                    id="refillAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={refillAmount}
                    onChange={(e) => setRefillAmount(e.target.value)}
                    placeholder="0"
                  />
                  <div className="flex gap-1">
                    <Button type="button" variant="outline" onClick={() => quickAdd(10)}>+10</Button>
                    <Button type="button" variant="outline" onClick={() => quickAdd(50)}>+50</Button>
                    <Button type="button" variant="outline" onClick={() => quickAdd(100)}>+100</Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isRefilling}>ยกเลิก</Button>
            </DialogClose>
            <Button onClick={confirmRefill} disabled={isRefilling} className="bg-green-600 hover:bg-green-700">
              {isRefilling ? 'กำลังบันทึก...' : 'ยืนยันการเติม'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-2xl">แก้ไขวัตถุดิบ</DialogTitle>
            <DialogDescription>ปรับชื่อ หน่วย ตำแหน่งเก็บ และจำนวนคงเหลือ</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-3">
              <Label htmlFor="editName">ชื่อวัตถุดิบ</Label>
              <Input
                id="editName"
                value={editForm.name}
                onChange={(e) => setEditForm(s => ({ ...s, name: e.target.value }))}
              />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="editStock">จำนวนสต๊อก</Label>
              <Input
                id="editStock"
                type="number"
                min="0"
                step="0.01"
                value={editForm.stockQty}
                onChange={(e) => setEditForm(s => ({ ...s, stockQty: e.target.value }))}
              />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="editUnit">หน่วย</Label>
              <Select value={editForm.unit} onValueChange={(v) => setEditForm(s => ({ ...s, unit: v }))}>
                <SelectTrigger id="editUnit">
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

            <div className="grid gap-3">
              <Label htmlFor="editLoc">ตำแหน่งเก็บ</Label>
              <Input
                id="editLoc"
                value={editForm.location}
                onChange={(e) => setEditForm(s => ({ ...s, location: e.target.value }))}
                placeholder="เช่น ตู้เย็น, ชั้นวาง"
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSavingEdit}>ยกเลิก</Button>
            </DialogClose>
            <Button onClick={confirmEdit} disabled={isSavingEdit} className="bg-blue-600 hover:bg-blue-700">
              {isSavingEdit ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-2xl text-red-700">ลบวัตถุดิบ</DialogTitle>
            <DialogDescription>การลบไม่สามารถย้อนกลับได้</DialogDescription>
          </DialogHeader>

          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            {deleteTarget ? (
              <div className="text-sm">
                <div><span className="font-semibold">ชื่อ: </span>{deleteTarget.name}</div>
                <div><span className="font-semibold">สต๊อก: </span>{deleteTarget.stockQty} {deleteTarget.unit}</div>
                <div><span className="font-semibold">ตำแหน่ง: </span>{deleteTarget.location?.location ?? '-'}</div>
              </div>
            ) : (
              <div className="text-sm">ไม่พบวัตถุดิบ</div>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isDeleting}>ยกเลิก</Button>
            </DialogClose>
            <Button onClick={confirmDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? 'กำลังลบ...' : 'ลบวัตถุดิบ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
