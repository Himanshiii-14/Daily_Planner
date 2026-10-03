"use client";

import { ThemeProvider } from "@/components/theme";

export function Providers({ children }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
