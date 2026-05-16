"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { db } from "@/lib/db";

export default function ReportsPage() {
  const categories = useLiveQuery(() => db.categories.toArray()) ?? [];
  const entries = useLiveQuery(() => db.entries.toArray()) ?? [];

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );
  const [generating, setGenerating] = useState(false);

  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  const monthEntries = entries.filter((e) => e.date.startsWith(selectedMonth));

  const catTotals = categories.map((cat) => {
    const expense = monthEntries
      .filter((e) => e.type === "expense" && e.categoryId === cat.id)
      .reduce((s, e) => s + e.amount, 0) / 100;
    const income = monthEntries
      .filter((e) => e.type === "income" && e.categoryId === cat.id)
      .reduce((s, e) => s + e.amount, 0) / 100;
    return { cat, expense, income };
  }).filter((r) => r.expense > 0 || r.income > 0);

  const totalExpense = catTotals.reduce((s, r) => s + r.expense, 0);
  const totalIncome = catTotals.reduce((s, r) => s + r.income, 0);

  function fmt(n: number) {
    return "$" + n.toFixed(2);
  }

  function getMonthLabel(val: string) {
    const [y, m] = val.split("-");
    return new Date(Number(y), Number(m) - 1).toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
  }

  const monthOptions: string[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthOptions.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    );
  }

  async function generatePDF() {
    setGenerating(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF();
      const monthLabel = getMonthLabel(selectedMonth);

      doc.setFontSize(20);
      doc.setTextColor(30, 41, 59);
      doc.text("Financial Report", 14, 20);

      doc.setFontSize(12);
      doc.setTextColor(100, 116, 139);
      doc.text(monthLabel, 14, 30);

      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 38);

      doc.setDrawColor(226, 232, 240);
      doc.line(14, 42, 196, 42);

      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text("Summary", 14, 52);

      autoTable(doc, {
        startY: 57,
        head: [["", "Amount"]],
        body: [
          ["Total Income", fmt(totalIncome)],
          ["Total Expenses", fmt(totalExpense)],
          ["Net Balance", fmt(totalIncome - totalExpense)],
        ],
        styles: { fontSize: 10, cellPadding: 4 },
        headStyles: { fillColor: [99, 102, 241], textColor: 255 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: { 1: { halign: "right" } },
        margin: { left: 14, right: 14 },
      });

      const afterSummary = (doc as any).lastAutoTable.finalY + 10;

      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text("Category Breakdown", 14, afterSummary);

      autoTable(doc, {
        startY: afterSummary + 5,
        head: [["Category", "Income", "Expenses", "Net"]],
        body: catTotals.map((r) => [
          `${r.cat.icon} ${r.cat.name}`,
          fmt(r.income),
          fmt(r.expense),
          fmt(r.income - r.expense),
        ]),
        foot: [["Total", fmt(totalIncome), fmt(totalExpense), fmt(totalIncome - totalExpense)]],
        styles: { fontSize: 10, cellPadding: 4 },
        headStyles: { fillColor: [99, 102, 241], textColor: 255 },
        footStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59], fontStyle: "bold" },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } },
        margin: { left: 14, right: 14 },
      });

      const afterBreakdown = (doc as any).lastAutoTable.finalY + 10;

      if (monthEntries.length > 0) {
        doc.setFontSize(11);
        doc.setTextColor(30, 41, 59);
        doc.text("All Entries", 14, afterBreakdown);

        autoTable(doc, {
          startY: afterBreakdown + 5,
          head: [["Date", "Category", "Type", "Note", "Amount"]],
          body: [...monthEntries]
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((e) => [
              e.date,
              `${catMap[e.categoryId]?.icon ?? ""} ${catMap[e.categoryId]?.name ?? "Unknown"}`,
              e.type.charAt(0).toUpperCase() + e.type.slice(1),
              e.note || "-",
              `${e.type === "income" ? "+" : "-"}${fmt(e.amount / 100)}`,
            ]),
          styles: { fontSize: 9, cellPadding: 3 },
          headStyles: { fillColor: [99, 102, 241], textColor: 255 },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          columnStyles: { 4: { halign: "right" } },
          margin: { left: 14, right: 14 },
        });
      }

      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Financial Tracker — ${monthLabel} — Page ${i} of ${pageCount}`,
          14,
          doc.internal.pageSize.height - 8
        );
      }

      doc.save(`financial-report-${selectedMonth}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Failed to generate PDF. Please try again.");
    }
    setGenerating(false);
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Reports</h1>
          <p className="text-sm text-slate-500 mt-0.5">Generate monthly PDF reports</p>
        </div>
      </div>

      {/* Month Picker + Generate */}
      <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-5 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <div className="flex-1">
            <label className="text-xs text-slate-400 mb-1 block">Select Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-[#0f1117] border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              {monthOptions.map((m) => (
                <option key={m} value={m}>
                  {getMonthLabel(m)}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={generatePDF}
            disabled={generating || monthEntries.length === 0}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded-lg transition font-medium"
          >
            {generating ? "Generating..." : "Download PDF"}
          </button>
        </div>
        {monthEntries.length === 0 && (
          <p className="text-xs text-slate-500 mt-3">
            No entries found for {getMonthLabel(selectedMonth)}. Add entries first.
          </p>
        )}
      </div>

      {/* Preview */}
      {monthEntries.length > 0 && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-1">Income</p>
              <p className="text-lg font-semibold text-green-400">{fmt(totalIncome)}</p>
            </div>
            <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-1">Expenses</p>
              <p className="text-lg font-semibold text-red-400">{fmt(totalExpense)}</p>
            </div>
            <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-1">Net</p>
              <p className={`text-lg font-semibold ${totalIncome - totalExpense >= 0 ? "text-green-400" : "text-red-400"}`}>
                {fmt(totalIncome - totalExpense)}
              </p>
            </div>
          </div>

          {/* Category Table Preview */}
          <div className="bg-[#1e293b] border border-slate-700 rounded-xl overflow-hidden mb-5">
            <div className="px-4 py-3 border-b border-slate-700">
              <p className="text-sm font-medium text-white">Category Breakdown — {getMonthLabel(selectedMonth)}</p>
            </div>
            <div className="divide-y divide-slate-700/50">
              {catTotals.map(({ cat, expense, income }) => (
                <div key={cat.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span>{cat.icon}</span>
                    <span className="text-sm text-slate-200">{cat.name}</span>
                  </div>
                  <div className="flex gap-6 text-sm">
                    {income > 0 && <span className="text-green-400">+{fmt(income)}</span>}
                    {expense > 0 && <span className="text-red-400">-{fmt(expense)}</span>}
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50">
                <span className="text-sm font-semibold text-white">Total</span>
                <div className="flex gap-6 text-sm font-semibold">
                  <span className="text-green-400">+{fmt(totalIncome)}</span>
                  <span className="text-red-400">-{fmt(totalExpense)}</span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500 text-center">
            {monthEntries.length} entries · Click "Download PDF" to save the full report
          </p>
        </>
      )}
    </div>
  );
}
