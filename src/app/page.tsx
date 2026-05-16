"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { useRouter } from "next/navigation";
import { db } from "@/lib/db";

export default function DashboardPage() {
  const router = useRouter();
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

  return (
    <div className="min-h-screen bg-[#0f1117] text-slate-200 pb-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Finance Tracker</h1>
          <p className="text-sm text-slate-500 mt-0.5">{monthLabel} — Monthly Overview</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => router.push("/add-entry")} className="px-4 py-2 rounded-full bg-[#1e293b] border border-slate-700 text-slate-400 text-sm hover:text-white hover:bg-slate-700 transition">+ New Expense</button>
          <button onClick={() => router.push("/add-entry")} className="px-4 py-2 rounded-full bg-indigo-600 border border-indigo-500 text-white text-sm hover:bg-indigo-500 transition">+ New Income</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Total Budget</p>
          <p className="text-2xl font-semibold text-white">{fmt(totalBudget)}</p>
          <p className="text-xs text-slate-500 mt-1">{monthLabel}</p>
        </div>
        <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Total Spent</p>
          <p className="text-2xl font-semibold text-red-400">{fmt(totalSpent)}</p>
          <p className="text-xs text-slate-500 mt-1">{overallPct}% of budget used</p>
        </div>
        <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Remaining</p>
          <p className={`text-2xl font-semibold ${remaining >= 0 ? "text-green-400" : "text-red-400"}`}>{fmt(remaining)}</p>
          <p className="text-xs text-slate-500 mt-1">{remaining >= 0 ? `${100 - overallPct}% left` : "Over budget"}</p>
        </div>
        <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Income</p>
          <p className="text-2xl font-semibold text-green-400">{fmt(totalIncome)}</p>
          <p className="text-xs text-slate-500 mt-1">{monthEntries.filter(e => e.type === "income").length} entries</p>
        </div>
      </div>

      <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm text-slate-400">Overall Budget Progress</p>
          <p className="text-sm text-white font-medium">{overallPct}%</p>
        </div>
        <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${overallPct}%`, backgroundColor: overallPct >= 90 ? "#f87171" : overallPct >= 70 ? "#f59e0b" : "#6366f1" }} />
        </div>
        <div className="flex justify-between mt-1.5 text-xs text-slate-500">
          <span>{fmt(totalSpent)} spent</span>
          <span>{fmt(totalBudget)} total</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Budget Categories</p>
            <button onClick={() => router.push("/categories")} className="text-xs text-indigo-400 hover:text-indigo-300 transition">Manage →</button>
          </div>
          <div className="flex flex-col gap-3">
            {catSpend.length === 0 && (
              <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-6 text-center">
                <p className="text-slate-500 text-sm">No categories yet.</p>
                <button onClick={() => router.push("/categories")} className="mt-2 text-xs text-indigo-400 hover:text-indigo-300">Add categories →</button>
              </div>
            )}
            {catSpend.map((cat) => (
              <div key={cat.id} className="bg-[#1e293b] border border-slate-700 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-200 flex items-center gap-2"><span>{cat.icon}</span>{cat.name}</span>
                  <span className="text-sm text-slate-400">
                    <span className={cat.over ? "text-red-400 font-semibold" : "text-white font-semibold"}>{fmt(cat.spent)}</span>
                    {" / "}{fmt(cat.budget)}
                  </span>
                </div>
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${cat.pct}%`, backgroundColor: cat.over ? "#f87171" : cat.color }} />
                </div>
                <div className="flex justify-between mt-1.5 text-xs text-slate-500">
                  <span>{cat.pct}% used</span>
                  <span>{cat.over ? `${fmt(cat.spent - cat.budget)} over` : `${fmt(cat.budget - cat.spent)} left`}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <div className="flex justify-between items-center mb-3">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Recent Entries</p>
              <button onClick={() => router.push("/entries")} className="text-xs text-indigo-400 hover:text-indigo-300 transition">View all →</button>
            </div>
            {recentEntries.length === 0 ? (
              <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-5 text-center">
                <p className="text-slate-500 text-sm">No entries yet.</p>
                <button onClick={() => router.push("/add-entry")} className="mt-2 text-xs text-indigo-400 hover:text-indigo-300">Add first entry →</button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {recentEntries.map((entry) => {
                  const cat = catMap[entry.categoryId];
                  return (
                    <div key={entry.id} className="bg-[#1e293b] border border-slate-700 rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{cat?.icon ?? "📦"}</span>
                        <div>
                          <p className="text-xs font-medium text-white">{cat?.name ?? "Unknown"}</p>
                          <p className="text-xs text-slate-500">{entry.date}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-semibold ${entry.type === "income" ? "text-green-400" : "text-red-400"}`}>
                        {entry.type === "income" ? "+" : "-"}${(entry.amount / 100).toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">Quick Stats</p>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm"><span className="text-slate-400">Total entries</span><span className="text-white font-medium">{monthEntries.length}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-400">Categories</span><span className="text-white font-medium">{categories.length}</span></div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Net this month</span>
                <span className={`font-medium ${totalIncome - totalSpent >= 0 ? "text-green-400" : "text-red-400"}`}>{fmt(totalIncome - totalSpent)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Avg per entry</span>
                <span className="text-white font-medium">
                  {monthEntries.filter(e => e.type === "expense").length > 0 ? fmt(totalSpent / monthEntries.filter(e => e.type === "expense").length) : "$0.00"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
