"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { db } from "@/lib/db";
import { useTheme } from "@/components/ThemeProvider";

export default function ReportsPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const categories = useLiveQuery(() => db.categories.toArray()) ?? [];
  const entries = useLiveQuery(() => db.entries.toArray()) ?? [];

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  const [generating, setGenerating] = useState(false);

  const card = isDark ? "#1e293b" : "#ffffff";
  const cardBorder = isDark ? "#334155" : "#e2e8f0";
  const textMain = isDark ? "#f1f5f9" : "#0f172a";
  const textSub = isDark ? "#94a3b8" : "#64748b";
  const inputBg = isDark ? "#0f1117" : "#f8fafc";

  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));
  const monthEntries = entries.filter((e) => e.date.startsWith(selectedMonth));

  const catTotals = categories.map((cat) => {
    const expense = monthEntries.filter((e) => e.type === "expense" && e.categoryId === cat.id).reduce((s, e) => s + e.amount, 0) / 100;
    const income = monthEntries.filter((e) => e.type === "income" && e.categoryId === cat.id).reduce((s, e) => s + e.amount, 0) / 100;
    return { cat, expense, income };
  }).filter((r) => r.expense > 0 || r.income > 0);

  const totalExpense = catTotals.reduce((s, r) => s + r.expense, 0);
  const totalIncome = catTotals.reduce((s, r) => s + r.income, 0);

  function fmt(n: number) { return "$" + n.toFixed(2); }
  function getMonthLabel(val: string) {
    const [y, m] = val.split("-");
    return new Date(Number(y), Number(m) - 1).toLocaleString("default", { month: "long", year: "numeric" });
  }

  const monthOptions: string[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthOptions.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  async function generatePDF() {
    setGenerating(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");
      const doc = new jsPDF();
      const monthLabel = getMonthLabel(selectedMonth);
      doc.setFontSize(20); doc.setTextColor(30, 41, 59); doc.text("Financial Report", 14, 20);
      doc.setFontSize(12); doc.setTextColor(100, 116, 139); doc.text(monthLabel, 14, 30);
      doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 38);
      doc.setDrawColor(226, 232, 240); doc.line(14, 42, 196, 42);
      doc.setFontSize(11); doc.setTextColor(30, 41, 59); doc.text("Summary", 14, 52);
      autoTable(doc, { startY: 57, head: [["", "Amount"]], body: [["Total Income", fmt(totalIncome)], ["Total Expenses", fmt(totalExpense)], ["Net Balance", fmt(totalIncome - totalExpense)]], styles: { fontSize: 10, cellPadding: 4 }, headStyles: { fillColor: [99, 102, 241], textColor: 255 }, alternateRowStyles: { fillColor: [248, 250, 252] }, columnStyles: { 1: { halign: "right" } }, margin: { left: 14, right: 14 } });
      const afterSummary = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(11); doc.setTextColor(30, 41, 59); doc.text("Category Breakdown", 14, afterSummary);
      autoTable(doc, { startY: afterSummary + 5, head: [["Category", "Income", "Expenses", "Net"]], body: catTotals.map((r) => [`${r.cat.icon} ${r.cat.name}`, fmt(r.income), fmt(r.expense), fmt(r.income - r.expense)]), foot: [["Total", fmt(totalIncome), fmt(totalExpense), fmt(totalIncome - totalExpense)]], styles: { fontSize: 10, cellPadding: 4 }, headStyles: { fillColor: [99, 102, 241], textColor: 255 }, footStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59], fontStyle: "bold" }, alternateRowStyles: { fillColor: [248, 250, 252] }, columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } }, margin: { left: 14, right: 14 } });
      doc.save(`financial-report-${selectedMonth}.pdf`);
    } catch (err) { alert("Failed to generate PDF."); }
    setGenerating(false);
  }

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "20px", fontWeight: "600", color: textMain }}>Reports</h1>
        <p style={{ fontSize: "13px", color: textSub, marginTop: "2px" }}>Generate monthly PDF reports</p>
      </div>

      {/* Month Picker */}
      <div style={{ background: card, border: `1px solid ${cardBorder}`, borderRadius: "16px", padding: "24px", marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: "12px", color: textSub, display: "block", marginBottom: "6px" }}>Select Month</label>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={{ width: "100%", background: inputBg, border: `1px solid ${cardBorder}`, borderRadius: "8px", padding: "10px 12px", fontSize: "14px", color: textMain, outline: "none" }}>
              {monthOptions.map((m) => <option key={m} value={m}>{getMonthLabel(m)}</option>)}
            </select>
          </div>
          <button onClick={generatePDF} disabled={generating || monthEntries.length === 0} style={{ padding: "10px 24px", background: monthEntries.length === 0 ? "#6366f166" : "#6366f1", border: "none", borderRadius: "8px", color: "#fff", fontSize: "14px", fontWeight: "500", cursor: monthEntries.length === 0 ? "not-allowed" : "pointer" }}>
            {generating ? "Generating..." : "Download PDF"}
          </button>
        </div>
        {monthEntries.length === 0 && <p style={{ fontSize: "12px", color: textSub, marginTop: "12px" }}>No entries found for {getMonthLabel(selectedMonth)}. Add entries first.</p>}
      </div>

      {/* Preview */}
      {monthEntries.length > 0 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "20px" }}>
            {[
              { label: "Income", value: fmt(totalIncome), color: "#4ade80" },
              { label: "Expenses", value: fmt(totalExpense), color: "#f87171" },
              { label: "Net", value: fmt(totalIncome - totalExpense), color: totalIncome - totalExpense >= 0 ? "#4ade80" : "#f87171" },
            ].map((s) => (
              <div key={s.label} style={{ background: card, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "14px" }}>
                <p style={{ fontSize: "12px", color: textSub, marginBottom: "4px" }}>{s.label}</p>
                <p style={{ fontSize: "20px", fontWeight: "600", color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          <div style={{ background: card, border: `1px solid ${cardBorder}`, borderRadius: "16px", overflow: "hidden" }}>
            <div style={{ padding: "14px 16px", borderBottom: `1px solid ${cardBorder}` }}>
              <p style={{ fontSize: "14px", fontWeight: "500", color: textMain }}>Category Breakdown — {getMonthLabel(selectedMonth)}</p>
            </div>
            {catTotals.map(({ cat, expense, income }, i) => (
              <div key={cat.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: `1px solid ${cardBorder}`, background: i % 2 === 0 ? card : isDark ? "#ffffff08" : "#f8fafc" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>{cat.icon}</span>
                  <span style={{ fontSize: "14px", color: textMain }}>{cat.name}</span>
                </div>
                <div style={{ display: "flex", gap: "20px", fontSize: "14px" }}>
                  {income > 0 && <span style={{ color: "#4ade80" }}>+{fmt(income)}</span>}
                  {expense > 0 && <span style={{ color: "#f87171" }}>-{fmt(expense)}</span>}
                </div>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", background: isDark ? "#ffffff12" : "#f1f5f9" }}>
              <span style={{ fontSize: "14px", fontWeight: "600", color: textMain }}>Total</span>
              <div style={{ display: "flex", gap: "20px", fontSize: "14px", fontWeight: "600" }}>
                <span style={{ color: "#4ade80" }}>+{fmt(totalIncome)}</span>
                <span style={{ color: "#f87171" }}>-{fmt(totalExpense)}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
