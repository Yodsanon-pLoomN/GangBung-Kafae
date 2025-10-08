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

interface FormIngredient {
  ingredientId: string;
  amount: string;
}

interface FormRecipe {
  sweetLevel: string;
  ingredients: FormIngredient[];
}

export default function MenuList() {
  const [items, setItems] = useState<Menu[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Menu | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Edit dialog state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Menu | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState<string>('0');
  const [isSaving, setIsSaving] = useState(false);

  // Delete confirm dialog
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Menu | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    price: '',
  });

  const [formRecipes, setFormRecipes] = useState<FormRecipe[]>([
    {
      sweetLevel: 'หวานน้อย',
      ingredients: [{ ingredientId: '', amount: '' }]
    }
  ]);

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

  /* ---------------- Create (POST) ---------------- */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const menuData: CreateMenuRequest = {
        name: formData.name,
        price: parseFloat(formData.price),
        recipe: formRecipes.map(recipe => ({
          sweetLevel: recipe.sweetLevel,
          ingredients: recipe.ingredients
            .filter(ing => ing.ingredientId && ing.amount)
            .map(ing => ({
              ingredientAmount: parseFloat(ing.amount),
              ingredient: { id: parseInt(ing.ingredientId) }
            }))
        }))
      };

      const response = await api.post('/api/gangbung/menu', menuData);

      const newItem: Menu = Array.isArray(response.data)
        ? response.data[0]
        : response.data;

      setItems([...items, newItem]);

      // Reset form and close dialog
      setFormData({ name: '', price: '' });
      setFormRecipes([
        {
          sweetLevel: 'หวานน้อย',
          ingredients: [{ ingredientId: '', amount: '' }]
        }
      ]);
      setIsAddOpen(false);
    } catch (error) {
      console.error('Error adding menu:', error);
      alert('เกิดข้อผิดพลาดในการเพิ่มเมนู');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRecipeSweetLevelChange = (recipeIndex: number, value: string) => {
    const newRecipes = [...formRecipes];
    newRecipes[recipeIndex].sweetLevel = value;
    setFormRecipes(newRecipes);
  };

  const handleIngredientChange = (recipeIndex: number, ingredientIndex: number, field: 'ingredientId' | 'amount', value: string) => {
    const newRecipes = [...formRecipes];
    newRecipes[recipeIndex].ingredients[ingredientIndex][field] = value;
    setFormRecipes(newRecipes);
  };

  const addIngredient = (recipeIndex: number) => {
    const newRecipes = [...formRecipes];
    newRecipes[recipeIndex].ingredients.push({ ingredientId: '', amount: '' });
    setFormRecipes(newRecipes);
  };

  const removeIngredient = (recipeIndex: number, ingredientIndex: number) => {
    const newRecipes = [...formRecipes];
    if (newRecipes[recipeIndex].ingredients.length > 1) {
      newRecipes[recipeIndex].ingredients = newRecipes[recipeIndex].ingredients.filter((_, i) => i !== ingredientIndex);
      setFormRecipes(newRecipes);
    }
  };

  const addRecipe = () => {
    setFormRecipes([
      ...formRecipes,
      {
        sweetLevel: 'หวานน้อย',
        ingredients: [{ ingredientId: '', amount: '' }]
      }
    ]);
  };

  const removeRecipe = (recipeIndex: number) => {
    if (formRecipes.length > 1) {
      setFormRecipes(formRecipes.filter((_, i) => i !== recipeIndex));
    }
  };

  const getIngredientUnit = (ingredientId: string) => {
    const ingredient = ingredients.find(ing => ing.id === parseInt(ingredientId));
    return ingredient?.unit || '';
  };

  const handleRowClick = (item: Menu) => {
    setSelectedItem(item);
    setIsDetailOpen(true);
  };

  const sweetLevelOptions = ['หวานน้อย', 'หวานกลาง', 'หวานมาก', 'ไม่หวาน'];

  /* ---------------- Edit (PUT) ---------------- */

  // สร้าง payload PUT โดยส่ง recipes เดิม (จาก item ใน state) กลับไปด้วย
  const buildMenuPutPayload = (base: Menu, newName: string, newPrice: number): CreateMenuRequest => {
    return {
      name: newName,
      price: newPrice,
      recipe: base.recipe.map(r => ({
        sweetLevel: r.sweetLevel,
        ingredients: r.ingredients.map(ri => ({
          ingredientAmount: ri.ingredientAmount,
          ingredient: { id: ri.ingredient.id }
        }))
      }))
    };
    // หมายเหตุ: ฝั่ง backend จะใช้ path PUT /api/gangbung/menu/{id}
    // และ map ข้อมูลตามโมเดลของคุณ
  };

  const openEdit = (menu: Menu, e?: React.MouseEvent) => {
    if (e) e.stopPropagation(); // กันไม่ให้เปิด detail dialog
    setEditTarget(menu);
    setEditName(menu.name);
    setEditPrice(String(menu.price ?? 0));
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

    setIsSaving(true);
    try {
      const body = buildMenuPutPayload(editTarget, editName.trim(), priceNum);
      await api.put(`/api/gangbung/menu/${editTarget.id}`, body);

      // อัปเดต state ทันที
      setItems(prev =>
        prev.map(m => (m.id === editTarget.id ? { ...m, name: editName.trim(), price: priceNum } : m))
      );

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
    if (e) e.stopPropagation(); // กันไม่ให้เปิด detail dialog
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

  return (
    <div className="p-6 overflow-y-auto">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">เมนู</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refreshMenus}>รีเฟรช</Button>
          {/* Add Menu Dialog */}
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                เพิ่มเมนู
              </Button>
            </DialogTrigger>
            <DialogContent className="sm=max-w-[700px] sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>เพิ่มเมนูใหม่</DialogTitle>
                <DialogDescription>
                  กรอกข้อมูลเมนูและสูตรส่วนผสม คลิกบันทึกเมื่อเสร็จสิ้น
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-6 py-4">
                {/* Menu Info */}
                <div className="space-y-4">
                  <div className="grid gap-3">
                    <Label htmlFor="name">ชื่อเมนู</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="เช่น Americano, Latte"
                    />
                  </div>

                  <div className="grid gap-3">
                    <Label htmlFor="price">ราคา (บาท)</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="0"
                      min="0"
                      step="1"
                    />
                  </div>
                </div>

                {/* Recipes Section */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <Label className="text-lg font-bold">สูตร (ระดับความหวาน)</Label>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addRecipe}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      เพิ่มสูตร
                    </Button>
                  </div>

                  <div className="space-y-6">
                    {formRecipes.map((recipe, recipeIndex) => (
                      <div key={recipeIndex} className="p-4 border rounded-lg bg-gray-50">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-semibold text-gray-700">สูตรที่ {recipeIndex + 1}</h3>
                          {formRecipes.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeRecipe(recipeIndex)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </Button>
                          )}
                        </div>

                        <div className="grid gap-3 mb-4">
                          <Label htmlFor={`sweetLevel-${recipeIndex}`}>ระดับความหวาน</Label>
                          <Select
                            value={recipe.sweetLevel}
                            onValueChange={(value) => handleRecipeSweetLevelChange(recipeIndex, value)}
                          >
                            <SelectTrigger id={`sweetLevel-${recipeIndex}`}>
                              <SelectValue placeholder="เลือกระดับความหวาน" />
                            </SelectTrigger>
                            <SelectContent>
                              {['หวานน้อย', 'หวานกลาง', 'หวานมาก', 'ไม่หวาน'].map((level) => (
                                <SelectItem key={level} value={level}>
                                  {level}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Ingredients */}
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <Label className="text-sm font-semibold">ส่วนผสม</Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addIngredient(recipeIndex)}
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              เพิ่มวัตถุดิบ
                            </Button>
                          </div>

                          <div className="space-y-3">
                            {recipe.ingredients.map((formIng, ingredientIndex) => (
                              <div key={ingredientIndex} className="flex gap-2 items-end">
                                <div className="flex-1 grid gap-2">
                                  <Label htmlFor={`ingredient-${recipeIndex}-${ingredientIndex}`} className="text-xs">
                                    วัตถุดิบ
                                  </Label>
                                  <Select
                                    value={formIng.ingredientId}
                                    onValueChange={(value) => handleIngredientChange(recipeIndex, ingredientIndex, 'ingredientId', value)}
                                  >
                                    <SelectTrigger id={`ingredient-${recipeIndex}-${ingredientIndex}`}>
                                      <SelectValue placeholder="เลือกวัตถุดิบ" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {ingredients.map((ing) => (
                                        <SelectItem key={ing.id} value={ing.id.toString()}>
                                          {ing.name} (คงเหลือ: {ing.stockQty} {ing.unit})
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="w-28 grid gap-2">
                                  <Label htmlFor={`amount-${recipeIndex}-${ingredientIndex}`} className="text-xs">
                                    ปริมาณ {formIng.ingredientId && `(${getIngredientUnit(formIng.ingredientId)})`}
                                  </Label>
                                  <Input
                                    id={`amount-${recipeIndex}-${ingredientIndex}`}
                                    type="number"
                                    value={formIng.amount}
                                    onChange={(e) => handleIngredientChange(recipeIndex, ingredientIndex, 'amount', e.target.value)}
                                    placeholder="0"
                                    min="0"
                                    step="0.01"
                                  />
                                </div>

                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeIngredient(recipeIndex, ingredientIndex)}
                                  disabled={recipe.ingredients.length === 1}
                                  className="mb-0.5"
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
                  <Button type="button" variant="outline">
                    ยกเลิก
                  </Button>
                </DialogClose>
                <Button onClick={handleSubmit}>บันทึก</Button>
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
          <div className="p-8 text-center text-gray-500">ไม่มีข้อมูลเมนู</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">ชื่อเมนู</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">ระดับความหวาน</th>
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
                      <Button
                        variant="secondary"
                        onClick={(e) => openEdit(item, e)}
                      >
                        แก้ไข
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={(e) => openDelete(item, e)}
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

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedItem?.name}</DialogTitle>
            <DialogDescription>
              รายละเอียดสูตรและส่วนผสม
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">ราคา</p>
                <p className="text-2xl font-bold text-blue-700">{selectedItem.price} บาท</p>
              </div>

              {/* All Recipes */}
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
                      {recipe.ingredients.map((recipeIng) => (
                        <div
                          key={recipeIng.id}
                          className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200"
                        >
                          <div>
                            <p className="font-medium text-gray-800">{recipeIng.ingredient.name}</p>
                            <p className="text-xs text-gray-500">
                              คงเหลือ: {recipeIng.ingredient.stockQty} {recipeIng.ingredient.unit}
                              {recipeIng.ingredient.location && ` • ${recipeIng.ingredient.location.location}`}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-blue-600">
                              {recipeIng.ingredientAmount} {recipeIng.ingredient.unit}
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

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-2xl">แก้ไขเมนู</DialogTitle>
            <DialogDescription>
              ปรับชื่อและราคา ระบบจะคงสูตร/ส่วนผสมเดิมไว้โดยอัตโนมัติ
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="editName">ชื่อเมนู</Label>
              <Input
                id="editName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="เช่น Americano"
              />
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
                placeholder="เช่น 50"
              />
            </div>

            {editTarget && (
              <div className="text-xs text-gray-500 mt-1">
                สูตรทั้งหมด: {editTarget.recipe.length} สูตร — ระบบจะส่งสูตรเดิมกลับไปกับคำขออัปเดต
              </div>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSaving}>
                ยกเลิก
              </Button>
            </DialogClose>
            <Button
              onClick={saveEdit}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700"
            >
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
              <Button type="button" variant="outline" disabled={isDeleting}>
                ยกเลิก
              </Button>
            </DialogClose>
            <Button
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'กำลังลบ...' : 'ลบเมนู'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
