'use client';

import React, { useEffect, useState } from 'react';
import { Ingredient, CreateIngredientRequest, Location as LocationType } from '@/lib/data';
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
  const [isOpen, setIsOpen] = useState(false); // add dialog
  const [isLoading, setIsLoading] = useState(true);

  // --- Add form state ---
  const [formData, setFormData] = useState({
    name: '',
    stockQty: '',
    unit: 'ml',
    location: ''
  });

  // --- Edit dialog state ---
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Ingredient | null>(null);
  const [editName, setEditName] = useState('');
  const [editQty, setEditQty] = useState<string>('0');
  const [editUnit, setEditUnit] = useState('ml');
  const [editLocation, setEditLocation] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // --- Delete dialog state ---
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Ingredient | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/gangbung/ingredients');

      console.log('API Response:', response.data);

      const data = Array.isArray(response.data)
        ? response.data
        : (response.data.items || response.data.data || []);

      setItems(data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ---------------- Add (POST) ---------------- */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const requestBody: CreateIngredientRequest = {
        name: formData.name.trim(),
        stockQty: parseFloat(formData.stockQty || '0'),
        unit: formData.unit
      };

      if (formData.location.trim()) {
        requestBody.location = { location: formData.location.trim() };
      }

      const response = await api.post('/api/gangbung/ingredient', requestBody);

      const newItem: Ingredient = Array.isArray(response.data)
        ? response.data[0]
        : response.data;

      setItems(prev => [...prev, newItem]);

      // Reset form and close dialog
      setFormData({ name: '', stockQty: '', unit: 'ml', location: '' });
      setIsOpen(false);
    } catch (error) {
      console.error('Error adding ingredient:', error);
      alert('เกิดข้อผิดพลาดในการเพิ่มวัตถุดิบ');
    }
  };

  /* ---------------- Edit (PUT) ---------------- */

  const openEdit = (ing: Ingredient) => {
    setEditTarget(ing);
    setEditName(ing.name);
    setEditQty(String(ing.stockQty ?? 0));
    setEditUnit(ing.unit);
    setEditLocation(ing.location?.location ?? '');
    setIsEditOpen(true);
  };

  // สร้าง payload สำหรับ PUT โดยส่งโครง Ingredient ทั้งตัว (ตามที่ backend รับ new Ingredient ใน controller)
  const buildPutPayload = (
    base: Ingredient,
    name: string,
    qty: number,
    unit: string,
    locationText: string
  ): Ingredient => {
    let loc: LocationType | null | undefined = null;

    if (locationText.trim()) {
      // ถ้ามี location เดิม มี id ก็ส่งกลับไปด้วย (ช่วย backend map เดิมได้)
      if (base.location?.id) {
        loc = { id: base.location.id, location: locationText.trim() };
      } else {
        loc = { id: 0 as unknown as number, location: locationText.trim() }; // id ไม่สำคัญ ถ้า backend ignore ก็โอเค
      }
    } else {
      loc = null; // ล้างตำแหน่งเก็บ
    }

    return {
      ...base,
      name: name.trim(),
      stockQty: qty,
      unit,
      location: loc ?? null
    };
  };

  const saveEdit = async () => {
    if (!editTarget) return;

    const qtyNum = Number(editQty);
    if (!editName.trim()) {
      alert('กรุณากรอกชื่อวัตถุดิบ');
      return;
    }
    if (Number.isNaN(qtyNum) || qtyNum < 0) {
      alert('จำนวนสต๊อกต้องเป็นตัวเลขและไม่ติดลบ');
      return;
    }
    if (!editUnit) {
      alert('กรุณาเลือกหน่วย');
      return;
    }

    setIsSaving(true);
    try {
      const body = buildPutPayload(editTarget, editName, qtyNum, editUnit, editLocation);

      // PUT /ingredient/{id}
      const res = await api.put(`/api/gangbung/ingredient/${editTarget.id}`, body);

      // ใช้ค่าตอบกลับจาก backend (ถ้ามี) อัปเดต state
      const updated: Ingredient = res.data ?? body;
      setItems(prev => prev.map(it => (it.id === updated.id ? updated : it)));

      setIsEditOpen(false);
      setEditTarget(null);
    } catch (e) {
      console.error('Update ingredient failed', e);
      alert('แก้ไขวัตถุดิบไม่สำเร็จ');
    } finally {
      setIsSaving(false);
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
      setItems(prev => prev.filter(it => it.id !== deleteTarget.id));
      setIsDeleteOpen(false);
      setDeleteTarget(null);
    } catch (e) {
      console.error('Delete ingredient failed', e);
      alert('ลบวัตถุดิบไม่สำเร็จ อาจมีการอ้างอิงในเมนู/ออเดอร์');
    } finally {
      setIsDeleting(false);
    }
  };

  /* ---------------- UI ---------------- */

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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">วัตถุดิบ</h2>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchData}>
            รีเฟรช
          </Button>

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
              <DialogHeader>
                <DialogTitle>เพิ่มวัตถุดิบใหม่</DialogTitle>
                <DialogDescription>
                  กรอกข้อมูลวัตถุดิบที่ต้องการเพิ่ม คลิกบันทึกเมื่อเสร็จสิ้น
                </DialogDescription>
              </DialogHeader>

              <form
                onSubmit={handleSubmit}
                className="grid gap-4 py-4"
              >
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

                <div className="grid gap-3">
                  <Label htmlFor="location">ตำแหน่งเก็บ (ไม่บังคับ)</Label>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="เช่น ตู้เย็น, ชั้นวาง"
                  />
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
      </div>

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
                      <Button
                        variant="secondary"
                        onClick={() => openEdit(item)}
                      >
                        แก้ไข
                      </Button>
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

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-2xl">แก้ไขวัตถุดิบ</DialogTitle>
            <DialogDescription>
              ปรับชื่อ จำนวน หน่วย และตำแหน่งเก็บ จากนั้นบันทึกเพื่ออัปเดตฐานข้อมูล
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="editName">ชื่อวัตถุดิบ</Label>
              <Input
                id="editName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="เช่น นม"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="editQty">จำนวนสต๊อก</Label>
              <Input
                id="editQty"
                type="number"
                min="0"
                step="0.01"
                value={editQty}
                onChange={(e) => setEditQty(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="editUnit">หน่วย</Label>
              <Select value={editUnit} onValueChange={(v) => setEditUnit(v)}>
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

            <div className="grid gap-2">
              <Label htmlFor="editLocation">ตำแหน่งเก็บ</Label>
              <Input
                id="editLocation"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                placeholder="เช่น ตู้เย็น, ชั้นวาง"
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSaving}>
                ยกเลิก
              </Button>
            </DialogClose>
            <Button onClick={saveEdit} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
              {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="text-2xl text-red-700">ลบวัตถุดิบ</DialogTitle>
            <DialogDescription>
              ยืนยันการลบวัตถุดิบนี้ การลบอาจไม่สำเร็จหากถูกอ้างอิงในเมนู/ออเดอร์
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            {deleteTarget ? (
              <div className="text-sm">
                <div><span className="font-semibold">ชื่อ: </span>{deleteTarget.name}</div>
                <div><span className="font-semibold">สต๊อก: </span>{deleteTarget.stockQty.toLocaleString()} {deleteTarget.unit}</div>
                <div><span className="font-semibold">ตำแหน่งเก็บ: </span>{deleteTarget.location?.location ?? '-'}</div>
              </div>
            ) : (
              <div className="text-sm">ไม่พบข้อมูลวัตถุดิบ</div>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isDeleting}>
                ยกเลิก
              </Button>
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
