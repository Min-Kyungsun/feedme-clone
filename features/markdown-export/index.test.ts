import { expect, test } from "vitest";

import { buildLlmUrl, markdownFilename } from "@/features/markdown-export";

test("프롬프트를 고르면 ChatGPT 주소의 q 쿼리에 인코딩해 담는다", () => {
  expect(buildLlmUrl("chatgpt", "요약해줘")).toBe(
    "https://chatgpt.com/?q=%EC%9A%94%EC%95%BD%ED%95%B4%EC%A4%98"
  );
});

test("프롬프트를 고르면 Claude 주소의 q 쿼리에 인코딩해 담는다", () => {
  expect(buildLlmUrl("claude", "쉽게 설명해줘")).toBe(
    "https://claude.ai/new?q=%EC%89%BD%EA%B2%8C%20%EC%84%A4%EB%AA%85%ED%95%B4%EC%A4%98"
  );
});

test("프롬프트가 없거나 공백뿐이면 빈 새 대화 주소를 돌려준다", () => {
  expect(buildLlmUrl("chatgpt", "")).toBe("https://chatgpt.com/");
  expect(buildLlmUrl("claude", "   ")).toBe("https://claude.ai/new");
});

test("파일명은 제목에서 만들고 파일에 쓸 수 없는 문자는 뺀다", () => {
  expect(
    markdownFilename({ title: 'Obsidian: 파일/노트 "정리법"?', host: "a.com" })
  ).toBe("Obsidian 파일노트 정리법.md");
});

test("제목이 없으면 호스트로 파일명을 만든다", () => {
  expect(markdownFilename({ title: "", host: "dev-notes.example.com" })).toBe(
    "dev-notes.example.com.md"
  );
});
