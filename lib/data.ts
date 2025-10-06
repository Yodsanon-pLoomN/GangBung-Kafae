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
}

export interface StockItem {
  id: number;
  name: string;
  stock: number;
  unit: string;
  min: number;
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

export const stockItems: StockItem[] = [
  { id: 1, name: 'เมล็ดกาแฟ', stock: 5000, unit: 'กรัม', min: 1000 },
  { id: 2, name: 'นม', stock: 10000, unit: 'มล.', min: 2000 },
  { id: 3, name: 'น้ำตาล', stock: 3000, unit: 'กรัม', min: 500 },
  { id: 4, name: 'ชาเขียว', stock: 800, unit: 'กรัม', min: 200 },
  { id: 5, name: 'ชาไทย', stock: 600, unit: 'กรัม', min: 150 },
  { id: 6, name: 'น้ำ', stock: 50000, unit: 'มล.', min: 10000 }
];