'use client';

import React, { useEffect, useState } from 'react';
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

interface Ingredient {
  id: number;
  name: string;
  stockQty: number;
  unit: string;
}

interface RecipeIngredient {
  id: number;
  ingredient: Ingredient;
  ingredientAmount: number;
}

interface Recipe {
  id: number;
  sweetness: number;
  ingredients: RecipeIngredient[];
}

interface MenuItem {
  id: number;
  name: string;
  recipe: Recipe;
  price: number;
}

interface FormIngredient {
  ingredientId: string;
  amount: string;
}

interface FormRecipe {
  sweetness: string;
  ingredients: FormIngredient[];
}

export default function MenuList() {
  const [items, setItems] = useState<MenuItem[] | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[] | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    price: '',
  });
  
  const [formRecipes, setFormRecipes] = useState<FormRecipe[]>([
    {
      sweetness: '50',
      ingredients: [{ ingredientId: '', amount: '' }]
    }
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [menuResponse, ingredientsResponse] = await Promise.all([
          axios.get('/api/gangbung/menu'),
          axios.get('/api/gangbung/ingredients')
        ]);
        setItems(menuResponse.data);
        setIngredients(ingredientsResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Create all recipes first
      const recipeIds: number[] = [];
      
      for (const recipe of formRecipes) {
        const recipeData = {
          sweetness: parseInt(recipe.sweetness),
          ingredients: recipe.ingredients
            .filter(ing => ing.ingredientId && ing.amount)
            .map(ing => ({
              ingredient: { id: parseInt(ing.ingredientId) },
              ingredientAmount: parseFloat(ing.amount)
            }))
        };
        
        const recipeResponse = await axios.post('/api/gangbung/recipe', recipeData);
        recipeIds.push(recipeResponse.data.id);
      }
      
      // Create Menu with first recipe (or you can modify this logic)
      const menuData = {
        name: formData.name,
        price: parseFloat(formData.price),
        recipe: { id: recipeIds[0] } // Using first recipe
      };
      
      const menuResponse = await axios.post('/api/gangbung/menu', menuData);
      
      // Add new item to list
      if (items) {
        setItems([...items, menuResponse.data]);
      } else {
        setItems([menuResponse.data]);
      }
      
      // Reset form and close dialog
      setFormData({ name: '', price: '' });
      setFormRecipes([
        {
          sweetness: '50',
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

  const handleRecipeSweetnessChange = (recipeIndex: number, value: string) => {
    const newRecipes = [...formRecipes];
    newRecipes[recipeIndex].sweetness = value;
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
        sweetness: '50',
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
    const ingredient = ingredients?.find(ing => ing.id === parseInt(ingredientId));
    return ingredient?.unit || '';
  };

  const handleRowClick = (item: MenuItem) => {
    setSelectedItem(item);
    setIsDetailOpen(true);
  };

  return (
    <div className="p-6 overflow-y-auto">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">เมนู</h2>
        
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
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
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
                      required
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
                      required
                    />
                  </div>
                </div>

                {/* Recipes Section */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <Label className="text-lg font-bold">สูตร</Label>
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
                          <Label htmlFor={`sweetness-${recipeIndex}`}>ความหวาน (%)</Label>
                          <Input
                            id={`sweetness-${recipeIndex}`}
                            type="number"
                            value={recipe.sweetness}
                            onChange={(e) => handleRecipeSweetnessChange(recipeIndex, e.target.value)}
                            placeholder="50"
                            min="0"
                            max="100"
                            step="1"
                            required
                          />
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
                                      {ingredients?.map((ing) => (
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
                                    required
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
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">ชื่อเมนู</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">ความหวาน</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">ราคา</th>
            </tr>
          </thead>
          <tbody>
            {items?.map((item) => {
              return (
                <tr 
                  key={item.id} 
                  className="border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors"
                  onClick={() => handleRowClick(item)}
                >
                  <td className="px-6 py-4 text-gray-800 font-medium">{item.name}</td>
                  <td className="px-6 py-4 text-center text-gray-600">
                    {item.recipe.sweetness}%
                  </td>
                  <td className="px-6 py-4 text-right text-gray-700 font-semibold">
                    {item.price.toLocaleString()} บาท
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedItem?.name}</DialogTitle>
            <DialogDescription>
              รายละเอียดสูตรและส่วนผสม
            </DialogDescription>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">ราคา</p>
                  <p className="text-2xl font-bold text-blue-700">{selectedItem.price} บาท</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">ความหวาน</p>
                  <p className="text-2xl font-bold text-green-700">{selectedItem.recipe.sweetness}%</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-3">ส่วนผสม</h3>
                <div className="space-y-2">
                  {selectedItem.recipe.ingredients.map((recipeIng) => (
                    <div 
                      key={recipeIng.id} 
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div>
                        <p className="font-medium text-gray-800">{recipeIng.ingredient.name}</p>
                        <p className="text-xs text-gray-500">
                          คงเหลือ: {recipeIng.ingredient.stockQty} {recipeIng.ingredient.unit}
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
            </div>
          )}
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">ปิด</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}