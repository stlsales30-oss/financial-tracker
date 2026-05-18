"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { useState, useRef } from "react";
import { db } from "@/lib/db";
import { useTheme } from "@/components/ThemeProvider";

export default function SettingsPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const settings = useLiveQuery(() => db.settings.toArray().then(arr => arr[0] ?? null)) ?? null;
  const categories = useLiveQuery(() => db.categories.toArray()) ?? [];
  const entries = useLiveQuery(() => db.entries.toArray()) ?? [];

  const [budget, setBudget] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [budgetSaved, setBudgetSaved] = useState(false);
  const [importMsg, setImportMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const currencies = ["USD", "EUR", "GBP", "PKR", "AED", "INR", "CAD", "AUD"];

  const card = isDark ? "#1e293b" : "#ffffff";
  const cardBorder = isDark ? "#334155" : "#e2e8f0";
  const textMain = isDark ? "#f1f5f9" : "#0f172a";
  const textSub = isDark ? "#94a3b8" : "#64748b";
  const inputBg = isDark ? "#0f1117" : "#f8fafc";

  const inputStyle = { background: inputBg, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "10px 12px", fontSize: "14px", color: textMain, outline: "none", width: "100%", boxSizing: "border-box" as const };
  const btnStyle = { padding: "10px 20px", background: "transparent", border: `1px solid ${cardBorder}`, borderRadius: "8px", color: textSub, fontSize: "14px", cursor: "pointer" };

  async function saveBudget() {
    const val = Number(budget);
    if (!val || val <= 0) return;
    if (settings?.id) { await db.settings.update(settings.id, { totalBudget: val, currency }); }
    else { await db.settings.add({ totalBudget: val, currency }); }
    setBudgetSaved(true);
    setTimeout(() => setBudgetSaved(false), 2000);
  }

  function exportJSON() {
    const data = { categories, entries, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `fintracker-backup-${new Date().toISOString().split("T")[0]}.json`; a.click(); URL.revokeObjectURL(url);
  }

  function exportCSV() {
    const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));
    const rows = [["Date", "Category", "Type", "Amount", "Note"], ...entries.map((e) => [e.date, catMap[e.categoryId]?.name ?? "Unknown", e.type, (e.amount / 100).toFixed(2), e.note])];
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `fintracker-entries-${new Date().toISOString().split("T")[0]}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.categories || !data.entries) { setImportMsg("Invalid file format."); return; }
      await db.categories.clear(); await db.entries.clear();
      for (const cat of data.categories) { const { id, ...rest } = cat; await db.categories.add(rest); }
      for (const entry of data.entries) { const { id, ...rest } = entry; await db.entries.add(rest); }
      setImportMsg(`Imported ${data.categories.length} categories and ${data.entries.length} entries!`);
    } catch { setImportMsg("Failed to import. Make sure the file is a valid backup."); }
    if (fileRef.current) fileRef.current.value = "";
  }

  async function clearAllData() {
    if (confirm("This will delete ALL your data. Cannot be undone. Are you sure?")) {
      await db.entries.clear(); await db.categories.clear(); await db.settings.clear(); window.location.reload();
    }
  }

  const sectionStyle = { background: card, border: `1px solid ${cardBorder}`, borderRadius: "16px", padding: "24px", marginBottom: "16px" };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "20px", fontWeight: "600", color: textMain }}>Settings</h1>
        <p style={{ fontSize: "13px", color: textSub, marginTop: "2px" }}>Manage your app preferences and data</p>
      </div>

      {/* Budget */}
      <div style={sectionStyle}>
        <h2 style={{ fontSize: "15px", fontWeight: "600", color: textMain, marginBottom: "4px" }}>Budget & Currency</h2>
        <p style={{ fontSize: "13px", color: textSub, marginBottom: "16px" }}>
          Current budget: <strong style={{ color: textMain }}>${settings?.totalBudget?.toLocaleString() ?? "5,000"}</strong> · Currency: <strong style={{ color: textMain }}>{settings?.currency ?? "USD"}</strong>
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
          <div>
            <label style={{ fontSize: "12px", color: textSub, display: "block", marginBottom: "6px" }}>Monthly Budget ($)</label>
            <input type="number" placeholder={String(settings?.totalBudget ?? 5000)} value={budget} onChange={(e) => setBudget(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: "12px", color: textSub, display: "block", marginBottom: "6px" }}>Currency</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={inputStyle}>
              {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <button onClick={saveBudget} style={{ padding: "10px 20px", background: "#6366f1", border: "none", borderRadius: "8px", color: "#fff", fontSize: "14px", cursor: "pointer" }}>
          {budgetSaved ? "Saved! ✓" : "Save Settings"}
        </button>
      </div>

      {/* Export */}
      <div style={sectionStyle}>
        <h2 style={{ fontSize: "15px", fontWeight: "600", color: textMain, marginBottom: "4px" }}>Export Data</h2>
        <p style={{ fontSize: "13px", color: textSub, marginBottom: "16px" }}>Download your data. Use JSON to restore on another device. CSV for spreadsheets.</p>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={exportJSON} style={btnStyle}>Export JSON</button>
          <button onClick={exportCSV} style={btnStyle}>Export CSV</button>
        </div>
        <p style={{ fontSize: "12px", color: textSub, marginTop: "10px" }}>{entries.length} entries · {categories.length} categories</p>
      </div>

      {/* Import */}
      <div style={sectionStyle}>
        <h2 style={{ fontSize: "15px", fontWeight: "600", color: textMain, marginBottom: "4px" }}>Import Data</h2>
        <p style={{ fontSize: "13px", color: textSub, marginBottom: "16px" }}>Restore from a JSON backup. This will replace all existing data.</p>
        <input ref={fileRef} type="file" accept=".json" onChange={handleImport} style={{ fontSize: "13px", color: textSub }} />
        {importMsg && <p style={{ fontSize: "13px", marginTop: "12px", color: importMsg.includes("Imported") ? "#4ade80" : "#f87171" }}>{importMsg}</p>}
      </div>

      {/* Notifications */}
      <div style={sectionStyle}>
        <h2 style={{ fontSize: "15px", fontWeight: "600", color: textMain, marginBottom: "4px" }}>Push Notifications</h2>
        <p style={{ fontSize: "13px", color: textSub, marginBottom: "16px" }}>Enable browser notifications. On iOS, install the app to home screen first (iOS 16.4+).</p>
        <button onClick={() => { if ("Notification" in window) { Notification.requestPermission().then((p) => alert(p === "granted" ? "Notifications enabled!" : "Blocked. Please enable in browser settings.")); } else { alert("Not supported in this browser."); } }} style={btnStyle}>
          Enable Notifications
        </button>
        <p style={{ fontSize: "12px", color: textSub, marginTop: "8px" }}>Live push sending requires backend (Phase 2).</p>
      </div>

      {/* Danger Zone */}
      <div style={{ ...sectionStyle, border: `1px solid rgba(239,68,68,0.3)` }}>
        <h2 style={{ fontSize: "15px", fontWeight: "600", color: "#f87171", marginBottom: "4px" }}>Danger Zone</h2>
        <p style={{ fontSize: "13px", color: textSub, marginBottom: "16px" }}>Permanently delete all your data. This cannot be undone.</p>
        <button onClick={clearAllData} style={{ padding: "10px 20px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", color: "#f87171", fontSize: "14px", cursor: "pointer" }}>
          Clear All Data
        </button>
      </div>
    </div>
  );
}
