"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";

const STORAGE_KEY = "theme";

// 첫 페인트 전에 실행해 깜빡임을 막는다. 저장된 선택이 없으면 OS 설정을 따른다.
export const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem("${STORAGE_KEY}");if(t==="dark"||(t===null&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

const isDark = () => document.documentElement.classList.contains("dark");

export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, isDark, () => false);

  function toggle() {
    const next = !isDark();
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch {
      // 저장이 막혀 있어도 현재 화면의 전환은 유지한다.
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label="다크모드 전환"
      aria-pressed={dark}
      onClick={toggle}
    >
      {dark ? <SunIcon /> : <MoonIcon />}
    </Button>
  );
}
