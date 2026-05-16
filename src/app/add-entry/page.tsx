"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/db";

export default function AddEntryPage() {
  const router = useRouter();
  const categories = useLiveQuery(() => db.categories.toArray()) ?? [];

  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    amount: "",
    categoryId: "",
    note: "",
    date: today,
    type: "expense" as "income" | "expense",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setError("");

    if (!form.amount || Number(form.amount) <= 0) {
      setError("Amount must be greater than 0.");
      return;
    }
    if (!form.categoryId) {
      setError("Please select a category.");
      return;
    }
    if (!form.date) {
      setError("Please select a date.");
      return;
    }
    if (form.date > today) {
      setError("Date cannot be in the future.");
      return;
    }
    if (form.note.length > 200) {
      setError("Note must be 200 characters or less.");
      return;
    }

    setSaving(true);
    await db.entries.add({
      amount: Math.round(Number(form.amount) * 100),
      categoryId: Number(form.categoryId),
      note: form.note.trim(),
      date: form.date,
      type: form.type,
    });
    setSaving(false);
    router.push("/entries");
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Add Entry</h1>
        <p className="text-sm text-slate-500 mt-0.5">Log a new financial entry</p>
      </div>

      <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-5">

        {/* Type Toggle */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setForm({ ...form, type: "expense" })}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
              form.type === "expense"
                ? "bg-red-500/20 border border-red-500/50 text-red-400"
                : "bg-[#0f1117] border border-slate-700 text-slate-500 hover:text-slate-300"
            }`}
          >
            Expense
          </button>
          <button
            onClick={() => setForm({ ...form, type: "income" })}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
              form.type === "income"
                ? "bg-green-500/20 border border-green-500/50 text-green-400"
                : "bg-[#0f1117] border border-slate-700 text-slate-500 hover:text-slate-300"
            }`}
          >
            Income
          </button>
        </div>

        {/* Amount */}
        <div className="mb-4">
          <label className="text-xs text-slate-400 mb-1 block">Amount ($)</label>
          <input
            type="number"
            placeholder="0.00"
            min="0.01"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="w-full bg-[#0f1117] border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Category */}
        <div className="mb-4">
          <label className="text-xs text-slate-400 mb-1 block">Category</label>
          <select
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            className="w-full bg-[#0f1117] border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div className="mb-4">
          <label className="text-xs text-slate-400 mb-1 block">Date</label>
          <input
            type="date"
            value={form.date}
            max={today}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="w-full bg-[#0f1117] border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Note */}
        <div className="mb-5">
          <label className="text-xs text-slate-400 mb-1 block">
            Note <span className="text-slate-600">({form.note.length}/200)</span>
          </label>
          <textarea
            placeholder="Optional note..."
            value={form.note}
            maxLength={200}
            rows={3}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            className="w-full bg-[#0f1117] border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 px-3 py-2 bg-red-900/30 border border-red-700/50 rounded-lg text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm rounded-lg transition font-medium"
          >
            {saving ? "Saving..." : "Save Entry"}
          </button>
          <button
            onClick={() => router.push("/entries")}
            className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
