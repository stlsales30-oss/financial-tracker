import Dexie, { type EntityTable } from "dexie";

export interface Category {
  id?: number;
  name: string;
  icon: string;
  color: string;
  budget: number;
}

export interface Entry {
  id?: number;
  amount: number;
  categoryId: number;
  note: string;
  date: string;
  type: "income" | "expense";
}

export interface AppSettings {
  id?: number;
  currency: string;
  totalBudget: number;
}

class FinanceDB extends Dexie {
  categories!: EntityTable<Category, "id">;
  entries!: EntityTable<Entry, "id">;
  settings!: EntityTable<AppSettings, "id">;

  constructor() {
    super("FinanceTrackerDB");
    this.version(1).stores({
      categories: "++id, name",
      entries: "++id, categoryId, date, type",
      settings: "++id",
    });
  }
}

export const db = new FinanceDB();

export async function seedDefaultData() {
  const count = await db.categories.count();
  if (count > 0) return;

  await db.categories.bulkAdd([
    { name: "Rent / Housing", icon: "🏠", color: "#6366f1", budget: 1800 },
    { name: "Groceries", icon: "🛒", color: "#22c55e", budget: 800 },
    { name: "Utility Bills", icon: "⚡", color: "#f59e0b", budget: 400 },
    { name: "Office Expenses", icon: "💼", color: "#3b82f6", budget: 1200 },
    { name: "Transport / Fuel", icon: "🚗", color: "#ec4899", budget: 400 },
    { name: "Miscellaneous", icon: "📦", color: "#14b8a6", budget: 400 },
  ]);

  await db.settings.add({ currency: "USD", totalBudget: 5000 });
}