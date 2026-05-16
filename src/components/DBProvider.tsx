"use client";
import { useEffect } from "react";
import { seedDefaultData } from "@/lib/db";

export default function DBProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    seedDefaultData();
  }, []);

  return <>{children}</>;
}