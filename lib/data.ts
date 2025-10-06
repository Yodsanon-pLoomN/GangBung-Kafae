// lib/data.ts
export interface Ingredient {
  name: string;
  amount: string;
  unit: string;
}

export interface Drink {
  id: number;
  name: string;
  category: string;
  ingredients: Ingredient[];
  price?: number;
}

export interface StockItem {
  id: number;
  name: string;
  stockQty: number;
  unit: string;
}

export const drinks: Drink[] = [
  {
    id: 1,
    name: 'เอสเปรสโซ',
    category: 'กาแฟ',
    ingredients: [
      { name: 'เมล็ดกาแฟ', amount: '18', unit: 'กรัม' },
      { name: 'น้ำ', amount: '30', unit: 'มล.' }
    ]
  },
  {
    id: 2,
    name: 'ลาเต้',
    category: 'กาแฟ',
    ingredients: [
      { name: 'เมล็ดกาแฟ', amount: '18', unit: 'กรัม' },
      { name: 'นม', amount: '200', unit: 'มล.' },
      { name: 'น้ำ', amount: '30', unit: 'มล.' }
    ]
  },
  {
    id: 3,
    name: 'ชาเขียว',
    category: 'ชา',
    ingredients: [
      { name: 'ชาเขียว', amount: '5', unit: 'กรัม' },
      { name: 'น้ำ', amount: '250', unit: 'มล.' },
      { name: 'น้ำตาล', amount: '10', unit: 'กรัม' }
    ]
  },
  {
    id: 4,
    name: 'คาปูชิโน่',
    category: 'กาแฟ',
    ingredients: [
      { name: 'เมล็ดกาแฟ', amount: '18', unit: 'กรัม' },
      { name: 'นม', amount: '150', unit: 'มล.' },
      { name: 'น้ำ', amount: '30', unit: 'มล.' }
    ]
  },
  {
    id: 5,
    name: 'ชาไทย',
    category: 'ชา',
    ingredients: [
      { name: 'ชาไทย', amount: '8', unit: 'กรัม' },
      { name: 'น้ำ', amount: '200', unit: 'มล.' },
      { name: 'นม', amount: '100', unit: 'มล.' },
      { name: 'น้ำตาล', amount: '20', unit: 'กรัม' }
    ]
  },
  {
    id: 6,
    name: 'อเมริกาโน่',
    category: 'กาแฟ',
    ingredients: [
      { name: 'เมล็ดกาแฟ', amount: '18', unit: 'กรัม' },
      { name: 'น้ำ', amount: '200', unit: 'มล.' }
    ]
  }
];

