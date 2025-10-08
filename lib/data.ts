// Location
export interface Location {
  id: number;
  location: string;
}

// Ingredient
export interface Ingredient {
  id: number;
  name: string;
  stockQty: number;
  unit: string;
  location?: Location | null;
}

// Recipe Ingredient (junction between recipe and ingredient)
export interface RecipeIngredient {
  id: number;
  ingredient: Ingredient;
  ingredientAmount: number;
}

// Recipe (represents one sweetness level variant)
export interface Recipe {
  id: number;
  sweetLevel: string;
  ingredients: RecipeIngredient[];
}

// Menu
export interface Menu {
  id: number;
  name: string;
  price: number;
  recipe: Recipe[]; // รายการสูตรที่เป็นไปได้ของเมนูนี้
}

// Order Item
export interface OrderItem {
  id: number;
  qty: number;

  // ในบาง response เก่ายังไม่มี menu
  menu?: Menu;

  // เพิ่ม: สูตรที่ถูกเลือกจริงในออเดอร์นี้
  // หมายเหตุ: บางกรณี GET เก่าอาจไม่มี ส่งให้ optional ไว้
  recipe?: Recipe;
}

// Order
export interface Order {
  id: number;
  createdAt: string; // ISO
  orderItems: OrderItem[];
}

/* ===== Request Body Types ===== */

// For POST Ingredient
export interface CreateIngredientRequest {
  name: string;
  stockQty: number;
  unit: string;
  location?: { location: string };
}

// For POST Menu
export interface CreateMenuRequest {
  name: string;
  price: number;
  recipe: {
    sweetLevel: string;
    ingredients: {
      ingredientAmount: number;
      ingredient: { id: number };
    }[];
  }[];
}

// For POST Order (อัปเดตให้รับ recipe.id ต่อรายการ)
export interface CreateOrderRequest {
  orderItems: {
    qty: number;
    menu: { id: number };

    // ใหม่: บังคับให้ระบุ recipe ที่เลือก
    recipe: { id: number };
  }[];
}

/* ===== Backward compatibility aliases (คงไว้ได้) ===== */
export type StockItem = Ingredient;
export type MenuItem = Menu;
