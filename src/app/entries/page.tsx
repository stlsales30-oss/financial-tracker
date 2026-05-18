"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/db";
import { useTheme } from "@/components/ThemeProvider";

export default function EntriesPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterCat, setFilterCat] = useState<string>("all");

  const categories = useLiveQuery(() => db.categories.toArray()) ?? [];
  const allEntries = useLiveQuery(() => db.entries.orderBy("date").reverse().toArray()) ?? [];
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  const filtered = allEntries.filter((e) => {
    const cat = catMap[e.categoryId];
    const matchSearch = search === "" || (cat?.name ?? "").toLowerCase().includes(search.toLowerCase()) || e.note.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || e.type === filterType;
    const matchCat = filterCat === "all" || String(e.categoryId) === filterCat;
    return matchSearch && matchType && matchCat;
  });

  async function handleDelete(id: number) {
    if (confirm("Delete this entry?")) await db.entries.delete(id);
  }

  const totalIncome = filtered.filter((e) => e.type === "income").reduce((s, e) => s + e.amount, 0);
  const totalExpense = filtered.filter((e) => e.type === "expense").reduce((s, e) => s + e.amount, 0);
  function fmt(cents: number) { return "$" + (cents / 100).toFixed(2); }

  const card = isDark ? "#1e293b" : "#ffffff";
  const cardBorder = isDark ? "#334155" : "#e2e8f0";
  const textMain = isDark ? "#f1f5f9" : "#0f172a";
  const textSub = isDark ? "#94a3b8" : "#64748b";
  const inputBg = isDark ? "#1e293b" : "#ffffff";

  return (
    <div style={{ maxWidth: "760px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: "600", color: textMain }}>Entries</h1>
          <p style={{ fontSize: "13px", color: textSub, marginTop: "2px" }}>{filtered.length} entries</p>
        </div>
        <button onClick={() => router.push("/add-entry")} style={{ padding: "8px 16px", background: "#6366f1", border: "none", borderRadius: "8px", color: "#fff", fontSize: "14px", cursor: "pointer" }}>+ Add Entry</button>
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "20px" }}>
        {[
          { label: "Income", value: fmt(totalIncome), color: "#4ade80" },
          { label: "Expenses", value: fmt(totalExpense), color: "#f87171" },
          { label: "Net", value: fmt(totalIncome - totalExpense), color: totalIncome - totalExpense >= 0 ? "#4ade80" : "#f87171" },
        ].map((s) => (
          <div key={s.label} style={{ background: card, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "14px" }}>
            <p style={{ fontSize: "12px", color: textSub, marginBottom: "4px" }}>{s.label}</p>
            <p style={{ fontSize: "18px", fontWeight: "600", color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
        <input type="text" placeholder="Search entries..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1, minWidth: "160px", background: inputBg, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "8px 12px", fontSize: "14px", color: textMain, outline: "none" }} />
        <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)} style={{ background: inputBg, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "8px 12px", fontSize: "14px", color: textMain, outline: "none" }}>
          <option value="all">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} style={{ background: inputBg, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "8px 12px", fontSize: "14px", color: textMain, outline: "none" }}>
          <option value="all">All Categories</option>
          {categories.map((c) => <option key={c.id} value={String(c.id)}>{c.icon} {c.name}</option>)}
        </select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div style={{ background: card, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "40px", textAlign: "center" }}>
          <p style={{ color: textSub, fontSize: "14px" }}>No entries found.</p>
          <button onClick={() => router.push("/add-entry")} style={{ marginTop: "12px", padding: "8px 16px", background: "#6366f1", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", cursor: "pointer" }}>Add your first entry</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filtered.map((entry) => {
            const cat = catMap[entry.categoryId];
            return (
              <div key={entry.id} style={{ background: card, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", background: (cat?.color ?? "#6366f1") + "22" }}>
                    {cat?.icon ?? "📦"}
                  </div>
                  <div>
                    <p style={{ fontSize: "14px", fontWeight: "500", color: textMain }}>{cat?.name ?? "Unknown"}</p>
                    <p style={{ fontSize: "12px", color: textSub }}>{entry.date}{entry.note ? ` · ${entry.note}` : ""}</p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "14px", fontWeight: "600", color: entry.type === "income" ? "#4ade80" : "#f87171" }}>
                    {entry.type === "income" ? "+" : "-"}{fmt(entry.amount)}
                  </span>
                  <button onClick={() => handleDelete(entry.id!)} style={{ padding: "6px 10px", fontSize: "12px", color: "#f87171", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "6px", cursor: "pointer" }}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
