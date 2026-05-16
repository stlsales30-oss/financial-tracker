"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { db, type Category } from "@/lib/db";

const COLORS = [
  "#6366f1", "#22c55e", "#f59e0b", "#3b82f6",
  "#ec4899", "#14b8a6", "#f87171", "#a78bfa",
];

const ICONS = ["🏠", "🛒", "⚡", "💼", "🚗", "📦", "🍔", "🏥", "🎮", "✈️", "📱", "👕"];

const empty = { name: "", icon: "📦", color: "#6366f1", budget: 0 };

export default function CategoriesPage() {
  const categories = useLiveQuery(() => db.categories.toArray()) ?? [];
  const [form, setForm] = useState<Omit<Category, "id">>(empty);
  const [editId, setEditId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function handleSave() {
    if (!form.name.trim()) return;
    if (editId !== null) {
      await db.categories.update(editId, form);
      setEditId(null);
    } else {
      await db.categories.add(form);
    }
    setForm(empty);
    setShowForm(false);
  }

  async function handleDelete(id: number) {
    if (confirm("Delete this category?")) {
      await db.categories.delete(id);
    }
  }

  function handleEdit(cat: Category) {
    setForm({ name: cat.name, icon: cat.icon, color: cat.color, budget: cat.budget });
    setEditId(cat.id!);
    setShowForm(true);
  }

  function handleCancel() {
    setForm(empty);
    setEditId(null);
    setShowForm(false);
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Categories</h1>
          <p className="text-sm text-slate-500 mt-0.5">{categories.length} categories</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition"
          >
            + Add Category
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-white mb-4">
            {editId !== null ? "Edit Category" : "New Category"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Name</label>
              <input
                type="text"
                placeholder="e.g. Groceries"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-[#0f1117] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Monthly Budget ($)</label>
              <input
                type="number"
                placeholder="0"
                value={form.budget || ""}
                onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })}
                className="w-full bg-[#0f1117] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="text-xs text-slate-400 mb-2 block">Icon</label>
            <div className="flex gap-2 flex-wrap">
              {ICONS.map((icon) => (
                <button
                  key={icon}
                  onClick={() => setForm({ ...form, icon })}
                  className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition ${
                    form.icon === icon
                      ? "bg-indigo-600 border-2 border-indigo-400"
                      : "bg-[#0f1117] border border-slate-700 hover:border-slate-500"
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-5">
            <label className="text-xs text-slate-400 mb-2 block">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setForm({ ...form, color })}
                  className={`w-8 h-8 rounded-full border-2 transition ${
                    form.color === color ? "border-white scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition"
            >
              {editId !== null ? "Save Changes" : "Add Category"}
            </button>
            <button
              onClick={handleCancel}
              className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="bg-[#1e293b] border border-slate-700 rounded-xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{ backgroundColor: cat.color + "22", border: `1.5px solid ${cat.color}44` }}
              >
                {cat.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{cat.name}</p>
                <p className="text-xs text-slate-500">Budget: ${cat.budget.toLocaleString()} / month</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
              <button
                onClick={() => handleEdit(cat)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(cat.id!)}
                className="px-3 py-1.5 text-xs text-red-400 hover:text-white bg-red-900/20 hover:bg-red-900/40 rounded-lg transition"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
