'use client';

import React, { useEffect, useState } from 'react';
import { Menu, Ingredient, CreateMenuRequest } from '@/lib/data';
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DialogCreateMenu from '@/components/ui/dialogcreatemenu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ------- ชนิดข้อมูลสำหรับฟอร์มแก้ไข ------- */
type EditFormIngredient = { ingredientId: string; amount: string };
type EditFormRecipe = { sweetLevel: string; ingredients: EditFormIngredient[] };

export default function MenuList() {
  const [items, setItems] = useState<Menu[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Menu | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // แก้ไข (ตอนนี้ให้แก้สูตรและส่วนผสมได้ด้วย)
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Menu | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState<string>('0');
  const [editRecipes, setEditRecipes] = useState<EditFormRecipe[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // ลบ
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Menu | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [menuResponse, ingredientsResponse] = await Promise.all([
          api.get('/api/gangbung/menu'),
          api.get('/api/gangbung/ingredients')
        ]);

        const menuData = Array.isArray(menuResponse.data)
          ? menuResponse.data
          : (menuResponse.data.items || menuResponse.data.data || []);

        const ingredientsData = Array.isArray(ingredientsResponse.data)
          ? ingredientsResponse.data
          : (ingredientsResponse.data.items || ingredientsResponse.data.data || []);

        setItems(menuData);
        setIngredients(ingredientsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setItems([]);
        setIngredients([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const refreshMenus = async () => {
    try {
      setIsLoading(true);
      const menuResponse = await api.get('/api/gangbung/menu');
      const menuData = Array.isArray(menuResponse.data)
        ? menuResponse.data
        : (menuResponse.data.items || menuResponse.data.data || []);
      setItems(menuData);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  /* ---------------- Edit (PUT) ---------------- */

  // แปลงข้อมูล Menu เดิม -> ฟอร์มแก้ไข (สามารถพิมพ์ชื่อสูตรเองได้)
  const primeEditFormFromMenu = (menu: Menu) => {
    setEditName(menu.name);
    setEditPrice(String(menu.price ?? 0));
    setEditRecipes(
      (menu.recipe || []).map(r => ({
        sweetLevel: r.sweetLevel || '',
        ingredients: (r.ingredients || []).map(ri => ({
          ingredientId: String(ri.ingredient.id),
          amount: String(ri.ingredientAmount)
        }))
      }))
    );
  };

  // สร้าง payload PUT จากฟอร์มแก้ไข
  const buildMenuPutPayload = (name: string, priceNum: number, recipes: EditFormRecipe[]): CreateMenuRequest => ({
    name,
    price: priceNum,
    recipe: recipes.map(r => ({
      sweetLevel: r.sweetLevel.trim(),
      ingredients: r.ingredients
        .filter(ing => ing.ingredientId && ing.amount !== '')
        .map(ing => ({
          ingredientAmount: parseFloat(ing.amount),
          ingredient: { id: parseInt(ing.ingredientId) }
        }))
    }))
  });

  const openEdit = (menu: Menu, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditTarget(menu);
    primeEditFormFromMenu(menu);
    setIsEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editTarget) return;

    const priceNum = Number(editPrice);
    if (!editName.trim()) {
      alert('กรุณากรอกชื่อเมนู');
      return;
    }
    if (Number.isNaN(priceNum) || priceNum < 0) {
      alert('ราคาต้องเป็นตัวเลขและไม่ติดลบ');
      return;
    }
    // ตรวจสูตรว่าง
    const hasAtLeastOneIngredient = editRecipes.some(r =>
      r.sweetLevel.trim() &&
      r.ingredients.some(ing => ing.ingredientId && parseFloat(ing.amount || '0') > 0)
    );
    if (!hasAtLeastOneIngredient) {
      alert('ต้องมีอย่างน้อย 1 สูตรที่ระบุส่วนผสมถูกต้อง');
      return;
    }

    setIsSaving(true);
    try {
      const body = buildMenuPutPayload(editName.trim(), priceNum, editRecipes);
      const res = await api.put(`/api/gangbung/menu/${editTarget.id}`, body);

   // หลัง await api.put(...)
const updatedMenu: Menu = Array.isArray(res.data) ? res.data[0] : res.data;

if (updatedMenu && updatedMenu.id) {
  // มี payload ที่ complete -> อัปเดตตรง ๆ
  setItems(prev =>
    prev.map(m => (m.id === updatedMenu.id ? updatedMenu : m))
  );
} else {
  // ไม่ได้เมนูตัวใหม่ (หรือ payload ไม่ครบ) -> รีเฟรชจาก backend แทน
  await refreshMenus();
}

      setIsEditOpen(false);
      setEditTarget(null);
    } catch (e) {
      console.error('Update menu failed', e);
      alert('แก้ไขเมนูไม่สำเร็จ');
    } finally {
      setIsSaving(false);
    }
  };

  /* ---------------- Delete (DELETE) ---------------- */

  const openDelete = (menu: Menu, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeleteTarget(menu);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/gangbung/menu/${deleteTarget.id}`);
      setItems(prev => prev.filter(m => m.id !== deleteTarget.id));
      setIsDeleteOpen(false);
      setDeleteTarget(null);
    } catch (e) {
      console.error('Delete menu failed', e);
      alert('ลบเมนูไม่สำเร็จ อาจมีการอ้างอิงจากออเดอร์หรือเรซิพี');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRowClick = (item: Menu) => {
    setSelectedItem(item);
    setIsDetailOpen(true);
  };

  /* ---------------- handlers ฟอร์มแก้สูตร ---------------- */

  const addRecipe = () =>
    setEditRecipes(prev => [...prev, { sweetLevel: '', ingredients: [{ ingredientId: '', amount: '' }] }]);

  const removeRecipe = (idx: number) =>
    setEditRecipes(prev => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));

  const changeRecipeName = (idx: number, value: string) =>
    setEditRecipes(prev => {
      const next = [...prev];
      next[idx].sweetLevel = value;
      return next;
    });

  const addIngredientToRecipe = (rIdx: number) =>
    setEditRecipes(prev => {
      const next = [...prev];
      next[rIdx].ingredients.push({ ingredientId: '', amount: '' });
      return next;
    });

  const removeIngredientFromRecipe = (rIdx: number, iIdx: number) =>
    setEditRecipes(prev => {
      const next = [...prev];
      if (next[rIdx].ingredients.length > 1) {
        next[rIdx].ingredients = next[rIdx].ingredients.filter((_, j) => j !== iIdx);
      }
      return next;
    });

  const changeIngredientField = (
    rIdx: number,
    iIdx: number,
    field: 'ingredientId' | 'amount',
    value: string
  ) =>
    setEditRecipes(prev => {
      const next = [...prev];
      next[rIdx].ingredients[iIdx][field] = value;
      return next;
    });

  const getIngredientUnit = (ingredientId: string) =>
    ingredients.find(i => i.id === parseInt(ingredientId))?.unit || '';

  return (
    <div className="p-6 overflow-y-auto">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">เมนู</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refreshMenus}>รีเฟรช</Button>
          <Button className="flex items-center gap-2" onClick={() => setIsAddOpen(true)}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            เพิ่มเมนู
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">กำลังโหลด...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-gray-500">ไม่มีข้อมูลเมนู</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">ชื่อเมนู</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">สูตร</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">ราคา</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors"
                  onClick={() => handleRowClick(item)}
                >
                  <td className="px-6 py-4 text-gray-800 font-medium">{item.name}</td>
                  <td className="px-6 py-4 text-center text-gray-600">
                    {item.recipe.map(r => r.sweetLevel).join(', ')}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-700 font-semibold">
                    {item.price.toLocaleString()} บาท
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="secondary" onClick={(e) => openEdit(item, e)}>แก้ไข</Button>
                      <Button variant="destructive" onClick={(e) => openDelete(item, e)}>ลบ</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedItem?.name}</DialogTitle>
            <DialogDescription>รายละเอียดสูตรและส่วนผสม</DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">ราคา</p>
                <p className="text-2xl font-bold text-blue-700">{selectedItem.price} บาท</p>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800">สูตรทั้งหมด ({selectedItem.recipe.length})</h3>
                {selectedItem.recipe.map((recipe, idx) => (
                  <div key={recipe.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold text-gray-700">สูตรที่ {idx + 1}</h4>
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        {recipe.sweetLevel}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-600 mb-2">ส่วนผสม:</p>
                      {recipe.ingredients.map((ri) => (
                        <div key={ri.id} className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                          <div>
                            <p className="font-medium text-gray-800">{ri.ingredient.name}</p>
                            <p className="text-xs text-gray-500">
                              คงเหลือ: {ri.ingredient.stockQty} {ri.ingredient.unit}
                              {ri.ingredient.location && ` • ${ri.ingredient.location.location}`}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-blue-600">
                              {ri.ingredientAmount} {ri.ingredient.unit}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">ปิด</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog (แก้ไขสูตร/ส่วนผสมได้) */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[760px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">แก้ไขเมนู</DialogTitle>
            <DialogDescription>ปรับชื่อ ราคา และสูตร/ส่วนผสมได้โดยตรง</DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-2">
            {/* ชื่อ/ราคา */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="editName">ชื่อเมนู</Label>
                <Input id="editName" value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editPrice">ราคา (บาท)</Label>
                <Input
                  id="editPrice"
                  type="number"
                  min="0"
                  step="1"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                />
              </div>
            </div>

            {/* สูตร */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <Label className="text-lg font-bold">สูตร</Label>
                <Button type="button" variant="outline" onClick={addRecipe}>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  เพิ่มสูตร
                </Button>
              </div>

              <div className="space-y-6">
                {editRecipes.map((recipe, rIdx) => (
                  <div key={rIdx} className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold text-gray-700">สูตรที่ {rIdx + 1}</h4>
                      <div className="flex items-center gap-2">
                        {editRecipes.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRecipe(rIdx)}
                            className="text-red-500 hover:text-red-700"
                          >
                            ลบสูตร
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* ชื่อสูตร (พิมพ์เอง) */}
                    <div className="grid gap-2 mb-4">
                      <Label htmlFor={`recipe-name-${rIdx}`}>ชื่อสูตร</Label>
                      <Input
                        id={`recipe-name-${rIdx}`}
                        value={recipe.sweetLevel}
                        onChange={(e) => changeRecipeName(rIdx, e.target.value)}
                        placeholder="เช่น หวานน้อย, หวานกลาง, ไม่หวาน หรือชื่อสูตรอื่นๆ"
                      />
                    </div>

                    {/* ส่วนผสม */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label className="text-sm font-semibold">ส่วนผสม</Label>
                        <Button type="button" variant="outline" size="sm" onClick={() => addIngredientToRecipe(rIdx)}>
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          เพิ่มวัตถุดิบ
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {recipe.ingredients.map((ing, iIdx) => (
                          <div key={iIdx} className="flex gap-2 items-end">
                            <div className="flex-1 grid gap-2">
                              <Label className="text-xs">วัตถุดิบ</Label>
                              <Select
                                value={ing.ingredientId}
                                onValueChange={(v) => changeIngredientField(rIdx, iIdx, 'ingredientId', v)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="เลือกวัตถุดิบ" />
                                </SelectTrigger>
                                <SelectContent>
                                  {ingredients.map((opt) => (
                                    <SelectItem key={opt.id} value={String(opt.id)}>
                                      {opt.name} (คงเหลือ: {opt.stockQty} {opt.unit})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="w-36 grid gap-2">
                              <Label className="text-xs">
                                ปริมาณ {ing.ingredientId && `(${getIngredientUnit(ing.ingredientId)})`}
                              </Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={ing.amount}
                                onChange={(e) => changeIngredientField(rIdx, iIdx, 'amount', e.target.value)}
                                placeholder="0"
                              />
                            </div>

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeIngredientFromRecipe(rIdx, iIdx)}
                              disabled={recipe.ingredients.length === 1}
                            >
                              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSaving}>ยกเลิก</Button>
            </DialogClose>
            <Button onClick={saveEdit} disabled={isSaving} >
              {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-2xl text-red-700">ลบเมนู</DialogTitle>
            <DialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการลบเมนูนี้? การลบอาจไม่สำเร็จหากเมนูถูกอ้างอิงโดยออเดอร์
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            {deleteTarget ? (
              <div className="text-sm">
                <div><span className="font-semibold">ชื่อ: </span>{deleteTarget.name}</div>
                <div><span className="font-semibold">ราคา: </span>{deleteTarget.price} บาท</div>
                <div><span className="font-semibold">จำนวนสูตร: </span>{deleteTarget.recipe.length}</div>
              </div>
            ) : (
              <div className="text-sm">ไม่พบเมนูที่เลือก</div>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isDeleting}>ยกเลิก</Button>
            </DialogClose>
            <Button onClick={confirmDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? 'กำลังลบ...' : 'ลบเมนู'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Menu Dialog Component (ของเดิม) */}
      <DialogCreateMenu
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        ingredients={ingredients}
        onCreated={(menu) => setItems(prev => [...prev, menu])}
      />
    </div>
  );
}
