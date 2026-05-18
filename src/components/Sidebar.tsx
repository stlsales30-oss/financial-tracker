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
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "./ThemeProvider";

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
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <aside
      style={{
        width: "240px",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        padding: "24px 16px",
        borderRight: isDark ? "1px solid #1e293b" : "1px solid #e2e8f0",
        backgroundColor: isDark ? "#0f1117" : "#ffffff",
        transition: "background-color 0.3s, border-color 0.3s",
      }}
    >
      {/* Logo */}
      <div style={{ marginBottom: "32px", padding: "0 8px" }}>
        <h1 style={{ fontSize: "18px", fontWeight: "700", color: isDark ? "#ffffff" : "#0f172a" }}>
          💰 FinTracker
        </h1>
        <p style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
          Personal Finance PWA
        </p>
      </div>

      {/* Nav Links */}
      <nav style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 12px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "500",
                textDecoration: "none",
                backgroundColor: active
                  ? isDark ? "#1e293b" : "#0f172a"
                  : "transparent",
                color: active
                  ? "#ffffff"
                  : isDark ? "#94a3b8" : "#475569",
                transition: "background-color 0.15s, color 0.15s",
              }}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Theme Toggle Button — clean outline only */}
      <button
        onClick={toggle}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "10px 12px",
          borderRadius: "8px",
          fontSize: "14px",
          fontWeight: "500",
          cursor: "pointer",
          marginTop: "16px",
          backgroundColor: "transparent",
          border: isDark ? "1.5px solid #334155" : "1.5px solid #cbd5e1",
          color: isDark ? "#94a3b8" : "#475569",
          transition: "border-color 0.2s, color 0.2s",
          width: "100%",
        }}
      >
        {isDark ? <Sun size={17} /> : <Moon size={17} />}
        {isDark ? "Light Mode" : "Dark Mode"}
      </button>
    </aside>
  );
}
