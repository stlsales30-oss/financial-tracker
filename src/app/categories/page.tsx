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

      {/* Form */}
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