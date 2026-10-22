"use client";

import {
  ArrowRightIcon,
  CircleAlertIcon,
  Link2Icon,
  LoaderCircleIcon,
  XIcon,
} from "lucide-react";
import { useRef, useState } from "react";

import { ExportPanel, type PromptChoice } from "./export-panel";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type ConvertedPage,
  ConversionFailure,
  isHttpUrl,
  MarkdownView,
  requestConversion,
} from "@/features/page-conversion";

type Phase =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "done"; page: ConvertedPage }
  | { kind: "error"; code: "fetch_failed" | "empty_content" };

const ERROR_COPY = {
  fetch_failed: {
    title: "페이지를 가져오지 못했습니다",
    description:
      "사이트에 접속할 수 없거나 서버가 오류로 응답했습니다. 주소를 확인하고 잠시 뒤에 다시 시도해 주세요.",
  },
  empty_content: {
    title: "본문을 찾지 못했습니다",
    description:
      "페이지는 열렸지만 읽을 수 있는 글이 없습니다. 로그인이 필요하거나 스크립트로만 그려지는 페이지일 수 있습니다.",
  },
} as const;

export function Converter() {
  const [url, setUrl] = useState("");
  const [urlInvalid, setUrlInvalid] = useState(false);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [choice, setChoice] = useState<PromptChoice>("none");
  const [custom, setCustom] = useState("");
  const latest = useRef(0);

  const busy = phase.kind === "loading";

  async function convert(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;

    if (!isHttpUrl(url)) {
      latest.current++;
      setUrlInvalid(true);
      setPhase({ kind: "idle" });
      return;
    }

    const id = ++latest.current;
    setUrlInvalid(false);
    setPhase({ kind: "loading" });
    try {
      const page = await requestConversion(url);
      if (id === latest.current) setPhase({ kind: "done", page });
    } catch (error) {
      if (id !== latest.current) return;
      setPhase({
        kind: "error",
        code:
          error instanceof ConversionFailure && error.code === "empty_content"
            ? "empty_content"
            : "fetch_failed",
      });
    }
  }

  function clear() {
    latest.current++;
    setUrl("");
    setCustom("");
    setUrlInvalid(false);
    setPhase({ kind: "idle" });
  }

  return (
    <>
      <Card>
        <CardContent>
          <form onSubmit={convert} noValidate className="flex flex-col gap-2">
            <label htmlFor="url" className="text-xs font-medium text-muted-foreground">
              웹 페이지 URL
            </label>
            <div className="flex flex-wrap gap-2">
              <Input
                id="url"
                type="text"
                inputMode="url"
                autoComplete="off"
                placeholder="https://example.com/article"
                className="min-w-56 flex-1"
                value={url}
                aria-invalid={urlInvalid || undefined}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setUrlInvalid(false);
                }}
              />
              <Button
                type="button"
                variant="outline"
                disabled={!url && phase.kind === "idle"}
                onClick={clear}
              >
                <XIcon data-icon="inline-start" />
                지우기
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? (
                  <>
                    <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />
                    변환 중…
                  </>
                ) : (
                  <>
                    <ArrowRightIcon data-icon="inline-start" />
                    변환
                  </>
                )}
              </Button>
            </div>
            {urlInvalid && (
              <p className="text-sm text-destructive">
                http:// 또는 https://로 시작하는 올바른 URL을 입력해 주세요.
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {phase.kind === "idle" && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
            <Link2Icon className="size-8 text-muted-foreground" />
            <p className="font-medium">아직 변환한 페이지가 없습니다</p>
            <p className="text-sm text-muted-foreground">
              위 입력란에 기사나 블로그 글 주소를 붙여넣고 변환을 눌러 보세요.
            </p>
          </CardContent>
        </Card>
      )}

      {phase.kind === "loading" && (
        <Card aria-busy="true">
          <CardContent className="flex flex-col gap-4">
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
            <Separator />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-11/12" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-3/5" />
          </CardContent>
        </Card>
      )}

      {phase.kind === "error" && (
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertTitle>{ERROR_COPY[phase.code].title}</AlertTitle>
          <AlertDescription>{ERROR_COPY[phase.code].description}</AlertDescription>
        </Alert>
      )}

      {phase.kind === "done" && (
        <Result
          page={phase.page}
          choice={choice}
          custom={custom}
          onChoiceChange={setChoice}
          onCustomChange={setCustom}
        />
      )}
    </>
  );
}

function Result({
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
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-2xl leading-tight font-semibold tracking-tight text-balance wrap-anywhere">
          {page.title || page.host}
        </h2>
        <p className="flex flex-wrap gap-x-3 text-sm text-muted-foreground">
          {page.author && (
            <strong className="font-medium text-foreground">{page.author}</strong>
          )}
          <span>{page.host}</span>
          <span>{page.markdown.length.toLocaleString("ko-KR")}자</span>
        </p>
      </div>
      <ExportPanel
        page={page}
        choice={choice}
        custom={custom}
        onChoiceChange={onChoiceChange}
        onCustomChange={onCustomChange}
      />
      <Card>
        <CardContent>
          <MarkdownView markdown={page.markdown} />
        </CardContent>
      </Card>
    </section>
  );
}
