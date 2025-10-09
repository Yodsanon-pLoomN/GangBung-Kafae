'use client';

import React, { useMemo, useState } from 'react';
import { Ingredient, Menu, CreateMenuRequest } from '@/lib/data';
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
  sweetLevel: string; // ใช้เป็น “ชื่อสูตร”
  ingredients: FormIngredient[];
}

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  ingredients: Ingredient[];
  onCreated: (menu: Menu) => void; // callback เมื่อสร้างสำเร็จ
};

export default function DialogCreateMenu({
  open,
  onOpenChange,
  ingredients,
  onCreated,
}: Props) {
  const [formData, setFormData] = useState({ name: '', price: '' });
  const [formRecipes, setFormRecipes] = useState<FormRecipe[]>([
    { sweetLevel: '', ingredients: [{ ingredientId: '', amount: '' }] },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const ingredientUnitById = useMemo(() => {
    const m = new Map<number, string>();
    ingredients.forEach((i) => m.set(i.id, i.unit));
    return m;
  }, [ingredients]);

  const getIngredientUnit = (ingredientId: string) => {
    const id = parseInt(ingredientId);
    return ingredientUnitById.get(id) || '';
  };

  const addRecipe = () =>
    setFormRecipes((prev) => [...prev, { sweetLevel: '', ingredients: [{ ingredientId: '', amount: '' }] }]);

  const removeRecipe = (idx: number) =>
    setFormRecipes((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));

  const handleRecipeNameChange = (idx: number, value: string) => {
    const next = [...formRecipes];
    next[idx].sweetLevel = value;
    setFormRecipes(next);
  };

  const addIngredient = (recipeIdx: number) => {
    const next = [...formRecipes];
    next[recipeIdx].ingredients.push({ ingredientId: '', amount: '' });
    setFormRecipes(next);
  };

  const removeIngredient = (recipeIdx: number, ingIdx: number) => {
    const next = [...formRecipes];
    if (next[recipeIdx].ingredients.length > 1) {
      next[recipeIdx].ingredients = next[recipeIdx].ingredients.filter((_, i) => i !== ingIdx);
      setFormRecipes(next);
    }
  };

  const handleIngredientChange = (
    recipeIdx: number,
    ingIdx: number,
    field: 'ingredientId' | 'amount',
    value: string
  ) => {
    const next = [...formRecipes];
    next[recipeIdx].ingredients[ingIdx][field] = value;
    setFormRecipes(next);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return alert('กรุณากรอกชื่อเมนู');
    if (!formData.price || Number(formData.price) < 0) return alert('กรุณากรอกราคาให้ถูกต้อง');
    if (formRecipes.some(r => !r.sweetLevel.trim())) return alert('กรุณากรอกชื่อสูตรให้ครบ');

    const payload: CreateMenuRequest = {
      name: formData.name.trim(),
      price: parseFloat(formData.price),
      recipe: formRecipes.map(r => ({
        sweetLevel: r.sweetLevel.trim(), // ใช้เป็นชื่อสูตร
        ingredients: r.ingredients
          .filter(ing => ing.ingredientId && ing.amount)
          .map(ing => ({
            ingredientAmount: parseFloat(ing.amount),
            ingredient: { id: parseInt(ing.ingredientId) }
          }))
      })),
    };

    try {
      setSubmitting(true);
      const res = await api.post('/api/gangbung/menu', payload);
      const created: Menu = Array.isArray(res.data) ? res.data[0] : res.data;

      // reset
      setFormData({ name: '', price: '' });
      setFormRecipes([{ sweetLevel: '', ingredients: [{ ingredientId: '', amount: '' }] }]);

      onCreated(created);
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      alert('เกิดข้อผิดพลาดในการเพิ่มเมนู');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
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
              <Label htmlFor="menu-name">ชื่อเมนู</Label>
              <Input
                id="menu-name"
                value={formData.name}
                onChange={(e) => setFormData(s => ({ ...s, name: e.target.value }))}
                placeholder="เช่น Americano, Latte"
              />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="menu-price">ราคา (บาท)</Label>
              <Input
                id="menu-price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(s => ({ ...s, price: e.target.value }))}
                placeholder="0"
                min="0"
                step="1"
              />
            </div>
          </div>

          {/* Recipes */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <Label className="text-lg font-bold">สูตร (ตั้งชื่อสูตรเอง)</Label>
              <Button type="button" variant="outline" onClick={addRecipe}>
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

                  {/* ชื่อสูตร (แทน Select เดิม) */}
                  <div className="grid gap-3 mb-4">
                    <Label htmlFor={`recipe-name-${recipeIndex}`}>ชื่อสูตร</Label>
                    <Input
                      id={`recipe-name-${recipeIndex}`}
                      value={recipe.sweetLevel}
                      onChange={(e) => handleRecipeNameChange(recipeIndex, e.target.value)}
                      placeholder="เช่น หวานน้อย / Extra Espresso / Oatmilk ..."
                    />
                  </div>

                  {/* Ingredients */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <Label className="text-sm font-semibold">ส่วนผสม</Label>
                      <Button type="button" variant="outline" size="sm" onClick={() => addIngredient(recipeIndex)}>
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

                          <div className="w-32 grid gap-2">
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
            <Button type="button" variant="outline" disabled={submitting}>
              ยกเลิก
            </Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'กำลังบันทึก...' : 'บันทึก'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
