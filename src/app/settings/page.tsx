"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { useState, useRef } from "react";
import { db } from "@/lib/db";

export default function SettingsPage() {
  const settings = useLiveQuery(() => db.settings.toArray().then(arr => arr[0] ?? null)) ?? null;
  const categories = useLiveQuery(() => db.categories.toArray()) ?? [];
  const entries = useLiveQuery(() => db.entries.toArray()) ?? [];

  const [budget, setBudget] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [budgetSaved, setBudgetSaved] = useState(false);
  const [importMsg, setImportMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const currencies = ["USD", "EUR", "GBP", "PKR", "AED", "INR", "CAD", "AUD"];

  async function saveBudget() {
    const val = Number(budget);
    if (!val || val <= 0) return;
    if (settings?.id) {
      await db.settings.update(settings.id, { totalBudget: val, currency });
    } else {
      await db.settings.add({ totalBudget: val, currency });
    }
    setBudgetSaved(true);
    setTimeout(() => setBudgetSaved(false), 2000);
  }

  function exportJSON() {
    const data = { categories, entries, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fintracker-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportCSV() {
    const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));
    const rows = [
      ["Date", "Category", "Type", "Amount", "Note"],
      ...entries.map((e) => [
        e.date,
        catMap[e.categoryId]?.name ?? "Unknown",
        e.type,
        (e.amount / 100).toFixed(2),
        e.note,
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fintracker-entries-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.categories || !data.entries) {
        setImportMsg("Invalid file format.");
        return;
      }
      await db.categories.clear();
      await db.entries.clear();
      for (const cat of data.categories) {
        const { id, ...rest } = cat;
        await db.categories.add(rest);
      }
      for (const entry of data.entries) {
        const { id, ...rest } = entry;
        await db.entries.add(rest);
      }
      setImportMsg(`Imported ${data.categories.length} categories and ${data.entries.length} entries successfully!`);
    } catch {
      setImportMsg("Failed to import. Make sure the file is a valid FinTracker JSON backup.");
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  async function clearAllData() {
    if (confirm("This will delete ALL your entries and categories. This cannot be undone. Are you sure?")) {
      await db.entries.clear();
      await db.categories.clear();
      await db.settings.clear();
      window.location.reload();
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your app preferences and data</p>
      </div>

      {/* Budget Settings */}
      <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-5 mb-4">
        <h2 className="text-sm font-semibold text-white mb-1">Budget & Currency</h2>
        <p className="text-xs text-slate-500 mb-4">
          Current budget: <span className="text-white font-medium">${settings?.totalBudget?.toLocaleString() ?? "5,000"}</span>
          {" · "}Currency: <span className="text-white font-medium">{settings?.currency ?? "USD"}</span>
        </p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Monthly Budget ($)</label>
            <input
              type="number"
              placeholder={String(settings?.totalBudget ?? 5000)}
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full bg-[#0f1117] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full bg-[#0f1117] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              {currencies.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={saveBudget}
          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition"
        >
          {budgetSaved ? "Saved!" : "Save Settings"}
        </button>
      </div>

      {/* Data Export */}
      <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-5 mb-4">
        <h2 className="text-sm font-semibold text-white mb-1">Export Data</h2>
        <p className="text-xs text-slate-500 mb-4">
          Download your data. Use JSON to restore on another device. CSV for spreadsheets.
        </p>
        <div className="flex gap-3">
          <button
            onClick={exportJSON}
            className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm rounded-lg transition"
          >
            Export JSON
          </button>
          <button
            onClick={exportCSV}
            className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm rounded-lg transition"
          >
            Export CSV
          </button>
        </div>
        <p className="text-xs text-slate-600 mt-2">
          {entries.length} entries · {categories.length} categories
        </p>
      </div>

      {/* Data Import */}
      <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-5 mb-4">
        <h2 className="text-sm font-semibold text-white mb-1">Import Data</h2>
        <p className="text-xs text-slate-500 mb-4">
          Restore from a JSON backup. This will replace all existing data.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="block text-sm text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-700 file:text-slate-200 hover:file:bg-slate-600 file:cursor-pointer"
        />
        {importMsg && (
          <p className={`text-xs mt-3 ${importMsg.includes("success") ? "text-green-400" : "text-red-400"}`}>
            {importMsg}
          </p>
        )}
      </div>

      {/* Notifications */}
      <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-5 mb-4">
        <h2 className="text-sm font-semibold text-white mb-1">Push Notifications</h2>
        <p className="text-xs text-slate-500 mb-4">
          Enable browser notifications for budget alerts. On iOS, install the app to your home screen first (requires iOS 16.4+).
        </p>
        <button
          onClick={() => {
            if ("Notification" in window) {
              Notification.requestPermission().then((perm) => {
                alert(perm === "granted" ? "Notifications enabled!" : "Notifications blocked. Please enable in browser settings.");
              });
            } else {
              alert("Notifications not supported in this browser.");
            }
          }}
          className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm rounded-lg transition"
        >
          Enable Notifications
        </button>
        <p className="text-xs text-slate-600 mt-2">
          Live push sending requires backend (Phase 2). Permission scaffolding only.
        </p>
      </div>

      {/* Danger Zone */}
      <div className="bg-[#1e293b] border border-red-900/40 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-red-400 mb-1">Danger Zone</h2>
        <p className="text-xs text-slate-500 mb-4">
          Permanently delete all your data. This cannot be undone.
        </p>
        <button
          onClick={clearAllData}
          className="px-5 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-700/50 text-red-400 text-sm rounded-lg transition"
        >
          Clear All Data
        </button>
      </div>
    </div>
  );
}
