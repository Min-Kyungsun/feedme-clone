"use client";

import {
  ArrowUpRightIcon,
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  InfoIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { ConvertedPage } from "@/features/page-conversion";
import {
  buildLlmUrl,
  copyText,
  downloadMarkdown,
  LLM_SERVICES,
  type LlmService,
  markdownFilename,
  PROMPT_PRESETS,
} from "@/features/markdown-export";

export type PromptChoice = "none" | "custom" | (typeof PROMPT_PRESETS)[number];

export function resolvePrompt(choice: PromptChoice, custom: string): string {
  if (choice === "none") return "";
  return choice === "custom" ? custom.trim() : choice;
}

type Note = { service: LlmService; prompt: string; copied: boolean };

export function ExportPanel({
  page,
  choice,
  custom,
  onChoiceChange,
  onCustomChange,
}: {
  page: ConvertedPage;
  choice: PromptChoice;
  custom: string;
  onChoiceChange: (choice: PromptChoice) => void;
  onCustomChange: (custom: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [note, setNote] = useState<Note | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const prompt = resolvePrompt(choice, custom);

  async function copy() {
    if (!(await copyText(page.markdown))) return;
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1800);
  }

  function openIn(service: LlmService) {
    // 사용자 클릭 직후 같은 틱에서 복사를 시작하고 탭을 연다(팝업 차단·포커스 이동 대비).
    const copying = copyText(page.markdown);
    window.open(buildLlmUrl(service, prompt), "_blank", "noopener,noreferrer");
    void copying.then((ok) => setNote({ service, prompt, copied: ok }));
  }

  function changeChoice(next: PromptChoice) {
    setNote(null);
    onChoiceChange(next);
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <Button type="button" className="max-sm:flex-1" onClick={copy}>
            {copied ? (
              <CheckIcon data-icon="inline-start" />
            ) : (
              <CopyIcon data-icon="inline-start" />
            )}
            {copied ? "복사됨" : "복사하기"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="max-sm:flex-1"
            onClick={() =>
              downloadMarkdown(markdownFilename(page), page.markdown)
            }
          >
            <DownloadIcon data-icon="inline-start" />
            .md 다운로드
          </Button>
        </div>

        <Separator />

        <div className="flex flex-col gap-3">
          <span id="prompt-label" className="text-xs font-medium text-muted-foreground">
            LLM으로 보내기 · 앞에 붙일 프롬프트
          </span>
          <ToggleGroup
            aria-labelledby="prompt-label"
            variant="outline"
            className="flex-wrap"
            value={[choice]}
            onValueChange={(next) =>
              changeChoice((next[0] as PromptChoice | undefined) ?? "none")
            }
          >
            <ToggleGroupItem value="none" className="aria-pressed:bg-primary aria-pressed:text-primary-foreground">
              없음
            </ToggleGroupItem>
            {PROMPT_PRESETS.map((preset) => (
              <ToggleGroupItem
                key={preset}
                value={preset}
                className="aria-pressed:bg-primary aria-pressed:text-primary-foreground"
              >
                {preset}
              </ToggleGroupItem>
            ))}
            <ToggleGroupItem value="custom" className="aria-pressed:bg-primary aria-pressed:text-primary-foreground">
              직접 입력
            </ToggleGroupItem>
          </ToggleGroup>

          {choice === "custom" && (
            <Input
              aria-label="직접 입력한 프롬프트"
              placeholder="예: 핵심만 세 줄로 정리하고 실행 항목을 뽑아줘"
              value={custom}
              onChange={(e) => {
                setNote(null);
                onCustomChange(e.target.value);
              }}
            />
          )}

          <p className="text-sm text-muted-foreground">
            {prompt
              ? `앞에 붙는 문장: “${prompt}”`
              : choice === "custom"
                ? "위 입력란에 적은 문장이 앞에 붙습니다. 저장되지 않습니다."
                : "프롬프트 없이 열립니다."}
          </p>

          <div className="flex flex-wrap gap-2">
            {(Object.keys(LLM_SERVICES) as LlmService[]).map((service) => (
              <Button
                key={service}
                type="button"
                className="max-sm:flex-1"
                onClick={() => openIn(service)}
              >
                {LLM_SERVICES[service].label}로 열기
                <ArrowUpRightIcon data-icon="inline-end" />
              </Button>
            ))}
          </div>

          {note && (
            <Alert role="status">
              <InfoIcon />
              <AlertTitle>
                {note.copied ? "본문이 복사되었습니다" : "본문을 복사하지 못했습니다"}
              </AlertTitle>
              <AlertDescription>
                {note.copied
                  ? `${
                      note.prompt
                        ? `새 탭의 ${LLM_SERVICES[note.service].label} 입력창에 “${note.prompt}”가 채워집니다.`
                        : `새 탭에서 ${LLM_SERVICES[note.service].label} 빈 대화가 열립니다.`
                    } 입력창에 붙여넣기(⌘V / Ctrl+V) 하세요.`
                  : "브라우저가 클립보드 접근을 막았습니다. 위의 복사하기 버튼으로 본문을 복사한 뒤 붙여넣어 주세요."}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
