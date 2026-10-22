import { AppShell } from "@/components/app-shell";
import { ThemeToggle } from "@/features/theme";

import { Converter } from "./_components/converter";

export default function Home() {
  return (
    <AppShell
      title="URL → Markdown"
      description="웹 페이지 주소를 붙여넣으면 본문을 Markdown으로 바꿔 LLM으로 바로 보냅니다."
      actions={<ThemeToggle />}
    >
      <Converter />
    </AppShell>
  );
}
