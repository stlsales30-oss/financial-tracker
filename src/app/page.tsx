"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { useRouter } from "next/navigation";
import { db } from "@/lib/db";
import { useTheme } from "@/components/ThemeProvider";

export default function DashboardPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const categories = useLiveQuery(() => db.categories.toArray()) ?? [];
  const entries = useLiveQuery(() => db.entries.toArray()) ?? [];
  const settings = useLiveQuery(() => db.settings.toArray().then(arr => arr[0] ?? null)) ?? null;
  const totalBudget = settings?.totalBudget ?? 5000;
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthEntries = entries.filter((e) => e.date.startsWith(currentMonth));
  const totalSpentCents = monthEntries.filter((e) => e.type === "expense").reduce((s, e) => s + e.amount, 0);
  const totalIncomeCents = monthEntries.filter((e) => e.type === "income").reduce((s, e) => s + e.amount, 0);
  const totalSpent = totalSpentCents / 100;
  const totalIncome = totalIncomeCents / 100;
  const remaining = totalBudget - totalSpent;
  const overallPct = Math.min(Math.round((totalSpent / totalBudget) * 100), 100);
  const monthLabel = now.toLocaleString("default", { month: "long", year: "numeric" });

  function fmt(amount: number) {
    return "$" + amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  const catSpend = categories.map((cat) => {
    const spent = monthEntries.filter((e) => e.type === "expense" && e.categoryId === cat.id).reduce((s, e) => s + e.amount, 0) / 100;
    const pct = cat.budget > 0 ? Math.min(Math.round((spent / cat.budget) * 100), 100) : 0;
    const over = spent > cat.budget;
    return { ...cat, spent, pct, over };
  });

  const recentEntries = [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  // Theme colors
  const card = isDark ? "#1e293b" : "#ffffff";
  const cardBorder = isDark ? "#334155" : "#e2e8f0";
  const textMain = isDark ? "#f1f5f9" : "#0f172a";
  const textSub = isDark ? "#94a3b8" : "#64748b";
  const trackBg = isDark ? "#334155" : "#e2e8f0";

  return (
    <div style={{ minHeight: "100vh", paddingBottom: "40px" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: "600", color: textMain }}>Finance Tracker</h1>
          <p style={{ fontSize: "13px", color: textSub, marginTop: "2px" }}>{monthLabel} — Monthly Overview</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => router.push("/add-entry")} style={{ padding: "8px 16px", borderRadius: "999px", border: `1px solid ${cardBorder}`, background: card, color: textSub, fontSize: "13px", cursor: "pointer" }}>+ New Expense</button>
          <button onClick={() => router.push("/add-entry")} style={{ padding: "8px 16px", borderRadius: "999px", background: "#6366f1", border: "none", color: "#fff", fontSize: "13px", cursor: "pointer", fontWeight: "500" }}>+ New Income</button>
        </div>
      </div>

      {/* Metric Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "20px" }}>
        {[
          { label: "Total Budget", value: fmt(totalBudget), color: textMain, sub: monthLabel },
          { label: "Total Spent", value: fmt(totalSpent), color: "#f87171", sub: `${overallPct}% of budget used` },
          { label: "Remaining", value: fmt(remaining), color: remaining >= 0 ? "#4ade80" : "#f87171", sub: remaining >= 0 ? `${100 - overallPct}% left` : "Over budget" },
          { label: "Income", value: fmt(totalIncome), color: "#4ade80", sub: `${monthEntries.filter(e => e.type === "income").length} entries` },
        ].map((m) => (
          <div key={m.label} style={{ background: card, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "16px" }}>
            <p style={{ fontSize: "11px", color: textSub, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>{m.label}</p>
            <p style={{ fontSize: "24px", fontWeight: "600", color: m.color }}>{m.value}</p>
            <p style={{ fontSize: "12px", color: textSub, marginTop: "4px" }}>{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Overall Progress Bar */}
      <div style={{ background: card, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "16px", marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
          <p style={{ fontSize: "14px", color: textSub }}>Overall Budget Progress</p>
          <p style={{ fontSize: "14px", color: textMain, fontWeight: "500" }}>{overallPct}%</p>
        </div>
        <div style={{ height: "10px", background: trackBg, borderRadius: "999px", overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: "999px", width: `${overallPct}%`, backgroundColor: overallPct >= 90 ? "#f87171" : overallPct >= 70 ? "#f59e0b" : "#6366f1", transition: "width 0.5s" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
          <p style={{ fontSize: "12px", color: textSub }}>{fmt(totalSpent)} spent</p>
          <p style={{ fontSize: "12px", color: textSub }}>{fmt(totalBudget)} total</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>

          {/* Budget Categories */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
              <p style={{ fontSize: "11px", color: textSub, textTransform: "uppercase", letterSpacing: "0.05em" }}>Budget Categories</p>
              <button onClick={() => router.push("/categories")} style={{ fontSize: "12px", color: "#6366f1", background: "none", border: "none", cursor: "pointer" }}>Manage →</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {catSpend.map((cat) => (
                <div key={cat.id} style={{ background: card, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontSize: "14px", color: textMain, display: "flex", alignItems: "center", gap: "8px" }}>
                      <span>{cat.icon}</span>{cat.name}
                    </span>
                    <span style={{ fontSize: "13px", color: textSub }}>
                      <span style={{ color: cat.over ? "#f87171" : textMain, fontWeight: "600" }}>{fmt(cat.spent)}</span>
                      {" / "}{fmt(cat.budget)}
                    </span>
                  </div>
                  <div style={{ height: "6px", background: trackBg, borderRadius: "999px", overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: "999px", width: `${cat.pct}%`, backgroundColor: cat.over ? "#f87171" : cat.color, transition: "width 0.5s" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
                    <p style={{ fontSize: "11px", color: textSub }}>{cat.pct}% used</p>
                    <p style={{ fontSize: "11px", color: textSub }}>{cat.over ? `${fmt(cat.spent - cat.budget)} over` : `${fmt(cat.budget - cat.spent)} left`}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* Recent Entries */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                <p style={{ fontSize: "11px", color: textSub, textTransform: "uppercase", letterSpacing: "0.05em" }}>Recent Entries</p>
                <button onClick={() => router.push("/entries")} style={{ fontSize: "12px", color: "#6366f1", background: "none", border: "none", cursor: "pointer" }}>View all →</button>
              </div>
              {recentEntries.length === 0 ? (
                <div style={{ background: card, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "20px", textAlign: "center" }}>
                  <p style={{ fontSize: "13px", color: textSub }}>No entries yet.</p>
                  <button onClick={() => router.push("/add-entry")} style={{ marginTop: "8px", fontSize: "12px", color: "#6366f1", background: "none", border: "none", cursor: "pointer" }}>Add first entry →</button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {recentEntries.map((entry) => {
                    const cat = catMap[entry.categoryId];
                    return (
                      <div key={entry.id} style={{ background: card, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span>{cat?.icon ?? "📦"}</span>
                          <div>
                            <p style={{ fontSize: "12px", fontWeight: "500", color: textMain }}>{cat?.name ?? "Unknown"}</p>
                            <p style={{ fontSize: "11px", color: textSub }}>{entry.date}</p>
                          </div>
                        </div>
                        <span style={{ fontSize: "12px", fontWeight: "600", color: entry.type === "income" ? "#4ade80" : "#f87171" }}>
                          {entry.type === "income" ? "+" : "-"}${(entry.amount / 100).toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div style={{ background: card, border: `1px solid ${cardBorder}`, borderRadius: "12px", padding: "16px" }}>
              <p style={{ fontSize: "11px", color: textSub, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>Quick Stats</p>
              {[
                { label: "Total entries", value: String(monthEntries.length) },
                { label: "Categories", value: String(categories.length) },
                { label: "Net this month", value: fmt(totalIncome - totalSpent), color: totalIncome - totalSpent >= 0 ? "#4ade80" : "#f87171" },
                { label: "Avg per entry", value: monthEntries.filter(e => e.type === "expense").length > 0 ? fmt(totalSpent / monthEntries.filter(e => e.type === "expense").length) : "$0.00" },
              ].map((s) => (
                <div key={s.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "13px", color: textSub }}>{s.label}</span>
                  <span style={{ fontSize: "13px", fontWeight: "500", color: s.color ?? textMain }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
