import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { THEME_INIT_SCRIPT, ThemeToggle } from "@/features/theme";

const root = document.documentElement;

function runInitScript(prefersDark: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: prefersDark }))
  );
  new Function(THEME_INIT_SCRIPT)();
}

beforeEach(() => {
  localStorage.clear();
  root.classList.remove("dark");
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("토글을 누르면 즉시 다크로 바뀌고 다시 누르면 라이트로 돌아온다", async () => {
  render(<ThemeToggle />);
  const toggle = screen.getByRole("button", { name: "다크모드 전환" });

  fireEvent.click(toggle);
  expect(root).toHaveClass("dark");
  await waitFor(() => expect(toggle).toHaveAttribute("aria-pressed", "true"));

  fireEvent.click(toggle);
  expect(root).not.toHaveClass("dark");
});

test("선택은 저장되어 다음 방문의 첫 페인트 전에 복원된다", () => {
  render(<ThemeToggle />);
  fireEvent.click(screen.getByRole("button", { name: "다크모드 전환" }));
  root.classList.remove("dark");

  runInitScript(false);

  expect(root).toHaveClass("dark");
});

test("저장된 라이트 선택은 OS가 다크여도 라이트로 유지한다", () => {
  localStorage.setItem("theme", "light");

  runInitScript(true);

  expect(root).not.toHaveClass("dark");
});

test("저장된 선택이 없으면 OS 설정을 따른다", () => {
  runInitScript(true);
  expect(root).toHaveClass("dark");

  root.classList.remove("dark");
  runInitScript(false);
  expect(root).not.toHaveClass("dark");
});
