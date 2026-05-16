"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ListOrdered,
  PlusCircle,
  Tag,
  FileText,
  Settings,
} from "lucide-react";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/entries", label: "Entries", icon: ListOrdered },
  { href: "/add-entry", label: "Add Entry", icon: PlusCircle },
  { href: "/categories", label: "Categories", icon: Tag },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 bg-white border-r border-slate-200 flex flex-col py-6 px-4 shrink-0">
      <div className="mb-8 px-2">
        <h1 className="text-xl font-bold text-slate-800">💰 FinTracker</h1>
        <p className="text-xs text-slate-400 mt-1">Personal Finance PWA</p>
      </div>
      <nav className="flex flex-col gap-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}