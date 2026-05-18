"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { db, type Category } from "@/lib/db";
import { useTheme } from "@/components/ThemeProvider";

const COLORS = ["#6366f1","#22c55e","#f59e0b","#3b82f6","#ec4899","#14b8a6","#f87171","#a78bfa"];
const ICONS = ["🏠","🛒","⚡","💼","🚗","📦","🍔","🏥","🎮","✈️","📱","👕"];
const empty = { name: "", icon: "📦", color: "#6366f1", budget: 0 };

export default function CategoriesPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const categories = useLiveQuery(() => db.categories.toArray()) ?? [];
  const [form, setForm] = useState<Omit<Category, "id">>(empty);
  const [editId, setEditId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  const card = isDark ? "#1e293b" : "#ffffff";
  const cardBorder = isDark ? "#334155" : "#e2e8f0";
  const textMain = isDark ? "#f1f5f9" : "#0f172a";
  const textSub = isDark ? "#94a3b8" : "#64748b";
  const inputBg = isDark ? "#0f1117" : "#f8fafc";

  async function handleSave() {
    if (!form.name.trim()) return;
    if (editId !== null) { await db.categories.update(editId, form); setEditId(null); }
    else { await db.categories.add(form); }
    setForm(empty); setShowForm(false);
  }
  async function handleDelete(id: number) { if (confirm("Delete this category?")) await db.categories.delete(id); }
  function handleEdit(cat: Category) { setForm({ name: cat.name, icon: cat.icon, color: cat.color, budget: cat.budget }); setEditId(cat.id!); setShowForm(true); }
  function handleCancel() { setForm(empty); setEditId(null); setShowForm(false); }

  const inputStyle = { width: "100%", background: inputBg, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "10px 12px", fontSize: "14px", color: textMain, outline: "none", boxSizing: "border-box" as const };

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: "600", color: textMain }}>Categories</h1>
          <p style={{ fontSize: "13px", color: textSub, marginTop: "2px" }}>{categories.length} categories</p>
        </div>
        {!showForm && <button onClick={() => setShowForm(true)} style={{ padding: "8px 16px", background: "#6366f1", border: "none", borderRadius: "8px", color: "#fff", fontSize: "14px", cursor: "pointer" }}>+ Add Category</button>}
      </div>

      {showForm && (
        <div style={{ background: card, border: `1px solid ${cardBorder}`, borderRadius: "16px", padding: "24px", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "14px", fontWeight: "600", color: textMain, marginBottom: "16px" }}>{editId !== null ? "Edit Category" : "New Category"}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
            <div>
              <label style={{ fontSize: "12px", color: textSub, display: "block", marginBottom: "6px" }}>Name</label>
              <input type="text" placeholder="e.g. Groceries" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: "12px", color: textSub, display: "block", marginBottom: "6px" }}>Monthly Budget ($)</label>
              <input type="number" placeholder="0" value={form.budget || ""} onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })} style={inputStyle} />
            </div>
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ fontSize: "12px", color: textSub, display: "block", marginBottom: "8px" }}>Icon</label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {ICONS.map((icon) => (
                <button key={icon} onClick={() => setForm({ ...form, icon })} style={{ width: "36px", height: "36px", borderRadius: "8px", fontSize: "18px", border: `2px solid ${form.icon === icon ? "#6366f1" : cardBorder}`, background: form.icon === icon ? "rgba(99,102,241,0.15)" : inputBg, cursor: "pointer" }}>{icon}</button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ fontSize: "12px", color: textSub, display: "block", marginBottom: "8px" }}>Color</label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {COLORS.map((color) => (
                <button key={color} onClick={() => setForm({ ...form, color })} style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: color, border: `3px solid ${form.color === color ? textMain : "transparent"}`, cursor: "pointer" }} />
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button onClick={handleSave} style={{ padding: "10px 20px", background: "#6366f1", border: "none", borderRadius: "8px", color: "#fff", fontSize: "14px", cursor: "pointer" }}>{editId !== null ? "Save Changes" : "Add Category"}</button>
            <button onClick={handleCancel} style={{ padding: "10px 20px", background: "transparent", border: `1px solid ${cardBorder}`, borderRadius: "8px", color: textSub, fontSize: "14px", cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {categories.map((cat) => (
          <div key={cat.id} style={{ background: card, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", backgroundColor: cat.color + "22", border: `1.5px solid ${cat.color}44` }}>{cat.icon}</div>
              <div>
                <p style={{ fontSize: "14px", fontWeight: "500", color: textMain }}>{cat.name}</p>
                <p style={{ fontSize: "12px", color: textSub }}>Budget: ${cat.budget.toLocaleString()} / month</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: cat.color }} />
              <button onClick={() => handleEdit(cat)} style={{ padding: "6px 12px", fontSize: "12px", color: textSub, background: "transparent", border: `1px solid ${cardBorder}`, borderRadius: "6px", cursor: "pointer" }}>Edit</button>
              <button onClick={() => handleDelete(cat.id!)} style={{ padding: "6px 12px", fontSize: "12px", color: "#f87171", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "6px", cursor: "pointer" }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
