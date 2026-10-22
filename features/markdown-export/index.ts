export const PROMPT_PRESETS = [
  "요약해줘",
  "한국어로 번역해줘",
  "쉽게 설명해줘",
] as const;

export type LlmService = "chatgpt" | "claude";

export const LLM_SERVICES: Record<
  LlmService,
  { label: string; base: string }
> = {
  chatgpt: { label: "ChatGPT", base: "https://chatgpt.com/" },
  claude: { label: "Claude", base: "https://claude.ai/new" },
};

// 본문은 URL에 싣지 않는다(길이 제한). 프롬프트만 q 쿼리로 미리 채운다.
export function buildLlmUrl(service: LlmService, prompt: string): string {
  const { base } = LLM_SERVICES[service];
  const text = prompt.trim();
  if (!text) return base;
  return `${base}?q=${encodeURIComponent(text)}`;
}

export function markdownFilename(page: { title: string; host: string }): string {
  const cleaned = page.title
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return `${cleaned || page.host}.md`;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function downloadMarkdown(filename: string, markdown: string) {
  const url = URL.createObjectURL(
    new Blob([markdown], { type: "text/markdown;charset=utf-8" })
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
