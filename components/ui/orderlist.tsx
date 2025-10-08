'use client';

import React, { useEffect, useState } from 'react';
import DrinkCard from './drinkcard';
import { Menu, Recipe, Ingredient } from '@/lib/data';
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

interface OrderListProps {
  selectedDrink: Menu | null;
  onSelectDrink: (drink: Menu) => void;
  onAddToOrder?: (menuId: number, recipeId: number, quantity: number) => void;
}

type ShortageRow = {
  ingredientId: number;
  name: string;
  unit: string;
  required: number;
  available: number;
};

export default function OrderList({ selectedDrink, onSelectDrink, onAddToOrder }: OrderListProps) {
  const [drinks, setDrinks] = useState<Menu[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [quantity, setQuantity] = useState('1');

  // สถานะระหว่างเช็ค/อัปเดตสต๊อก
  const [isChecking, setIsChecking] = useState(false);
  const [shortages, setShortages] = useState<ShortageRow[]>([]);

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await api.get('/api/gangbung/menu');

        const data = Array.isArray(response.data)
          ? response.data
          : (response.data.items || response.data.data || []);

        setDrinks(data);
      } catch (err) {
        console.error('Error fetching menus:', err);
        setError('ไม่สามารถโหลดรายการเมนูได้');
        setDrinks([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenus();
  }, []);

  const handleDrinkClick = (drink: Menu) => {
    onSelectDrink(drink);
    setSelectedMenu(drink);

    // Auto-select first recipe if only one available
    if (drink.recipe.length === 1) {
      setSelectedRecipe(drink.recipe[0]);
    } else {
      setSelectedRecipe(null);
    }

    setQuantity('1');
    setShortages([]);
    setIsDialogOpen(true);
  };

  // รวม "ความต้องการใช้วัตถุดิบ" สำหรับสูตรที่เลือกตามจำนวนแก้ว
  const buildRequirementsForSelection = () => {
    if (!selectedRecipe) return new Map<number, { name: string; unit: string; required: number }>();
    const qty = Math.max(1, parseInt(quantity) || 1);
    const req = new Map<number, { name: string; unit: string; required: number }>();
    for (const ri of selectedRecipe.ingredients) {
      const ing = ri.ingredient;
      const need = (ri.ingredientAmount || 0) * qty;
      req.set(ing.id, {
        name: ing.name,
        unit: ing.unit,
        required: (req.get(ing.id)?.required || 0) + need,
      });
    }
    return req;
  };

  // เช็คสต๊อก: โหลดของจริงจาก backend -> เทียบกับที่ต้องใช้
  const checkStockEnough = async (): Promise<{ ok: boolean; shortages: ShortageRow[]; fresh: Ingredient[] }> => {
    const ingRes = await api.get('/api/gangbung/ingredients');
    const fresh: Ingredient[] = Array.isArray(ingRes.data)
      ? ingRes.data
      : (ingRes.data.items || ingRes.data.data || []);

    const stockMap = new Map<number, Ingredient>();
    for (const ing of fresh) stockMap.set(ing.id, ing);

    const req = buildRequirementsForSelection();
    const notEnough: ShortageRow[] = [];

    for (const [ingId, r] of req.entries()) {
      const have = stockMap.get(ingId)?.stockQty ?? 0;
      if (have < r.required) {
        notEnough.push({
          ingredientId: ingId,
          name: r.name,
          unit: r.unit,
          required: r.required,
          available: have,
        });
      }
    }

    return { ok: notEnough.length === 0, shortages: notEnough, fresh };
  };

  // อัปเดตสต๊อกจริง: PUT /ingredient/{id} สำหรับแต่ละรายการที่ใช้
  const deductStock = async (freshIngredients: Ingredient[]) => {
    // ทำ mapping จาก fresh (เพราะมีค่า name/unit/location ล่าสุด)
    const freshMap = new Map<number, Ingredient>();
    freshIngredients.forEach(i => freshMap.set(i.id, i));

    const req = buildRequirementsForSelection();

    for (const [ingId, r] of req.entries()) {
      const current = freshMap.get(ingId);
      if (!current) continue;

      const newQty = Math.max(0, (current.stockQty ?? 0) - r.required);

      const putBody: Ingredient = {
        ...current,
        stockQty: newQty,
        // คง location ตามเดิม
      };

      await api.put(`/api/gangbung/ingredient/${ingId}`, putBody);
      // อัปเดตใน freshMap เผื่อใช้ต่อ
      freshMap.set(ingId, { ...current, stockQty: newQty });
    }
  };

  // กดเพิ่มลงตะกร้า -> เช็คสต๊อก -> ถ้าพอให้หักสต๊อกจริง แล้วค่อย addToOrder
  const handleAddToOrder = async () => {
    if (!selectedMenu || !selectedRecipe || !quantity || parseInt(quantity) <= 0) {
      alert('กรุณาเลือกสูตรและระบุจำนวน');
      return;
    }

    setIsChecking(true);
    setShortages([]);
    try {
      const { ok, shortages: notEnough, fresh } = await checkStockEnough();

      if (!ok) {
        setShortages(notEnough);
        return; // ไม่หักสต๊อก / ไม่เพิ่มลงตะกร้า
      }

      // พอสต๊อก -> หักสต๊อกจริงในฐานข้อมูล
      await deductStock(fresh);

      // ค่อยใส่ตะกร้าให้ OrderPanel
      if (onAddToOrder) {
        onAddToOrder(selectedMenu.id, selectedRecipe.id, parseInt(quantity));
      }

      // ปิด dialog และรีเซ็ต
      setIsDialogOpen(false);
      setSelectedMenu(null);
      setSelectedRecipe(null);
      setQuantity('1');
      setShortages([]);
    } catch (error) {
      console.error('Error checking/updating stock:', error);
      alert('เกิดข้อผิดพลาดในการอัปเดตสต๊อก');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="p-6 overflow-y-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">รายการเมนูเครื่องดื่ม</h2>

      {isLoading ? (
        <div className="p-8 text-center text-gray-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
          <p>กำลังโหลดเมนู...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            ลองใหม่
          </button>
        </div>
      ) : drinks.length === 0 ? (
        <div className="p-8 text-center text-gray-500">ไม่มีเมนูเครื่องดื่ม</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {drinks.map((drink) => (
            <DrinkCard
              key={drink.id}
              drink={drink}
              isSelected={selectedDrink?.id === drink.id}
              onClick={() => handleDrinkClick(drink)}
            />
          ))}
        </div>
      )}

      {/* Order Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedMenu?.name}</DialogTitle>
            <DialogDescription>
              เลือกสูตรและระบุจำนวนที่ต้องการสั่ง
            </DialogDescription>
          </DialogHeader>

          {selectedMenu && (
            <div className="space-y-6 py-4">
              {/* Price Display */}
              <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                <span className="text-gray-600 font-medium">ราคา</span>
                <span className="text-2xl font-bold text-blue-700">
                  {selectedMenu.price} บาท
                </span>
              </div>

              {/* Recipe Selection */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">เลือกสูตร</Label>
                <div className="grid gap-2">
                  {selectedMenu.recipe.map((recipe) => (
                    <button
                      key={recipe.id}
                      type="button"
                      onClick={() => {
                        setSelectedRecipe(recipe);
                        setShortages([]); // เปลี่ยนสูตรแล้วล้างสถานะขาด
                      }}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        selectedRecipe?.id === recipe.id
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-gray-800">
                          {recipe.sweetLevel}
                        </span>
                        {selectedRecipe?.id === recipe.id && (
                          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {recipe.ingredients.length} ส่วนผสม
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity Input */}
              <div className="space-y-3">
                <Label htmlFor="quantity" className="text-base font-semibold">
                  จำนวน
                </Label>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const current = parseInt(quantity) || 1;
                      if (current > 1) {
                        setQuantity((current - 1).toString());
                        setShortages([]);
                      }
                    }}
                    disabled={(parseInt(quantity) || 1) <= 1}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </Button>

                  <Input
                    id="quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => {
                      setQuantity(e.target.value);
                      setShortages([]);
                    }}
                    className="text-center text-lg font-semibold"
                    min="1"
                    max="99"
                  />

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const current = parseInt(quantity) || 1;
                      if (current < 99) {
                        setQuantity((current + 1).toString());
                        setShortages([]);
                      }
                    }}
                    disabled={(parseInt(quantity) || 1) >= 99}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </Button>
                </div>
              </div>

              {/* Shortage notice (ถ้ามี) */}
              {shortages.length > 0 && (
                <div className="p-3 rounded-lg border border-red-200 bg-red-50">
                  <p className="text-red-700 font-semibold mb-2">สต๊อกไม่เพียงพอ</p>
                  <div className="text-sm">
                    {shortages.map(s => (
                      <div key={s.ingredientId} className="flex justify-between">
                        <span>• {s.name}</span>
                        <span>
                          ต้องใช้ {s.required.toLocaleString()} {s.unit} • คงเหลือ {s.available.toLocaleString()} {s.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">ปรับจำนวนแก้วหรือลองสูตรอื่น</p>
                </div>
              )}

              {/* Total Price */}
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border-2 border-green-200">
                <span className="text-gray-700 font-semibold text-lg">ยอดรวม</span>
                <span className="text-3xl font-bold text-green-700">
                  {(selectedMenu.price * (parseInt(quantity) || 1)).toLocaleString()} บาท
                </span>
              </div>
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isChecking}>
                ยกเลิก
              </Button>
            </DialogClose>
            <Button
              onClick={handleAddToOrder}
              disabled={!selectedRecipe || isChecking}
              className="bg-green-600 hover:bg-green-700"
            >
              {isChecking ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  กำลังอัปเดตสต๊อก...
                </div>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  เพิ่มลงตะกร้า
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
