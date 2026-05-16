"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/db";

export default function EntriesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterCat, setFilterCat] = useState<string>("all");

  const categories = useLiveQuery(() => db.categories.toArray()) ?? [];
  const allEntries = useLiveQuery(() =>
    db.entries.orderBy("date").reverse().toArray()
  ) ?? [];

  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  const filtered = allEntries.filter((e) => {
    const cat = catMap[e.categoryId];
    const matchSearch =
      search === "" ||
      (cat?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      e.note.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || e.type === filterType;
    const matchCat = filterCat === "all" || String(e.categoryId) === filterCat;
    return matchSearch && matchType && matchCat;
  });

  async function handleDelete(id: number) {
    if (confirm("Delete this entry?")) {
      await db.entries.delete(id);
    }
  }

  const totalIncome = filtered
    .filter((e) => e.type === "income")
    .reduce((s, e) => s + e.amount, 0);

  const totalExpense = filtered
    .filter((e) => e.type === "expense")
    .reduce((s, e) => s + e.amount, 0);

  function fmt(cents: number) {
    return "$" + (cents / 100).toFixed(2);
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Entries</h1>
          <p className="text-sm text-slate-500 mt-0.5">{filtered.length} entries</p>
        </div>
        <button
          onClick={() => router.push("/add-entry")}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition"
        >
          + Add Entry
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-3">
          <p className="text-xs text-slate-500 mb-1">Income</p>
          <p className="text-lg font-semibold text-green-400">{fmt(totalIncome)}</p>
        </div>
        <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-3">
          <p className="text-xs text-slate-500 mb-1">Expenses</p>
          <p className="text-lg font-semibold text-red-400">{fmt(totalExpense)}</p>
        </div>
        <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-3">
          <p className="text-xs text-slate-500 mb-1">Net</p>
          <p className={`text-lg font-semibold ${totalIncome - totalExpense >= 0 ? "text-green-400" : "text-red-400"}`}>
            {fmt(totalIncome - totalExpense)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        <input
          type="text"
          placeholder="Search entries..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[160px] bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as "all" | "income" | "expense")}
          className="bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="all">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Entries List */}
      {filtered.length === 0 ? (
        <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-10 text-center">
          <p className="text-slate-500 text-sm">No entries found.</p>
          <button
            onClick={() => router.push("/add-entry")}
            className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition"
          >
            Add your first entry
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((entry) => {
            const cat = catMap[entry.categoryId];
            return (
              <div
                key={entry.id}
                className="bg-[#1e293b] border border-slate-700 rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0"
                    style={{
                      backgroundColor: (cat?.color ?? "#6366f1") + "22",
                      border: `1.5px solid ${(cat?.color ?? "#6366f1")}44`,
                    }}
                  >
                    {cat?.icon ?? "📦"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {cat?.name ?? "Unknown"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {entry.date}
                      {entry.note ? ` · ${entry.note}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm font-semibold ${
                      entry.type === "income" ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {entry.type === "income" ? "+" : "-"}{fmt(entry.amount)}
                  </span>
                  <button
                    onClick={() => handleDelete(entry.id!)}
                    className="px-2.5 py-1 text-xs text-red-400 hover:text-white bg-red-900/20 hover:bg-red-900/40 rounded-lg transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
