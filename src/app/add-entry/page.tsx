"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/db";
import { useTheme } from "@/components/ThemeProvider";

export default function AddEntryPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const categories = useLiveQuery(() => db.categories.toArray()) ?? [];
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({ amount: "", categoryId: "", note: "", date: today, type: "expense" as "income" | "expense" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const card = isDark ? "#1e293b" : "#ffffff";
  const cardBorder = isDark ? "#334155" : "#e2e8f0";
  const textMain = isDark ? "#f1f5f9" : "#0f172a";
  const textSub = isDark ? "#94a3b8" : "#64748b";
  const inputBg = isDark ? "#0f1117" : "#f8fafc";

  async function handleSave() {
    setError("");
    if (!form.amount || Number(form.amount) <= 0) { setError("Amount must be greater than 0."); return; }
    if (!form.categoryId) { setError("Please select a category."); return; }
    if (!form.date) { setError("Please select a date."); return; }
    if (form.date > today) { setError("Date cannot be in the future."); return; }
    if (form.note.length > 200) { setError("Note must be 200 characters or less."); return; }
    setSaving(true);
    await db.entries.add({ amount: Math.round(Number(form.amount) * 100), categoryId: Number(form.categoryId), note: form.note.trim(), date: form.date, type: form.type });
    setSaving(false);
    router.push("/entries");
  }

  const inputStyle = { width: "100%", background: inputBg, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "10px 12px", fontSize: "14px", color: textMain, outline: "none", boxSizing: "border-box" as const };

  return (
    <div style={{ maxWidth: "520px", margin: "0 auto" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "20px", fontWeight: "600", color: textMain }}>Add Entry</h1>
        <p style={{ fontSize: "13px", color: textSub, marginTop: "2px" }}>Log a new financial entry</p>
      </div>

      <div style={{ background: card, border: `1px solid ${cardBorder}`, borderRadius: "16px", padding: "24px" }}>

        {/* Type Toggle */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
          {(["expense", "income"] as const).map((t) => (
            <button key={t} onClick={() => setForm({ ...form, type: t })} style={{
              flex: 1, padding: "10px", borderRadius: "8px", fontSize: "14px", fontWeight: "500", cursor: "pointer", border: "1.5px solid",
              backgroundColor: form.type === t ? (t === "expense" ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)") : "transparent",
              borderColor: form.type === t ? (t === "expense" ? "#ef4444" : "#22c55e") : cardBorder,
              color: form.type === t ? (t === "expense" ? "#f87171" : "#4ade80") : textSub,
            }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Amount */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontSize: "12px", color: textSub, display: "block", marginBottom: "6px" }}>Amount ($)</label>
          <input type="number" placeholder="0.00" min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} style={inputStyle} />
        </div>

        {/* Category */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontSize: "12px", color: textSub, display: "block", marginBottom: "6px" }}>Category</label>
          <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} style={inputStyle}>
            <option value="">Select a category</option>
            {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>)}
          </select>
        </div>

        {/* Date */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontSize: "12px", color: textSub, display: "block", marginBottom: "6px" }}>Date</label>
          <input type="date" value={form.date} max={today} onChange={(e) => setForm({ ...form, date: e.target.value })} style={inputStyle} />
        </div>

        {/* Note */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ fontSize: "12px", color: textSub, display: "block", marginBottom: "6px" }}>Note ({form.note.length}/200)</label>
          <textarea placeholder="Optional note..." value={form.note} maxLength={200} rows={3} onChange={(e) => setForm({ ...form, note: e.target.value })} style={{ ...inputStyle, resize: "none" }} />
        </div>

        {error && <div style={{ marginBottom: "16px", padding: "10px 12px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", fontSize: "13px", color: "#f87171" }}>{error}</div>}

        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: "12px", background: "#6366f1", border: "none", borderRadius: "8px", color: "#fff", fontSize: "14px", fontWeight: "500", cursor: "pointer" }}>
            {saving ? "Saving..." : "Save Entry"}
          </button>
          <button onClick={() => router.push("/entries")} style={{ padding: "12px 20px", background: "transparent", border: `1px solid ${cardBorder}`, borderRadius: "8px", color: textSub, fontSize: "14px", cursor: "pointer" }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
