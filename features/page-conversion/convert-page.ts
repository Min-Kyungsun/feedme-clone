import { parseHTML } from "linkedom";
import { Defuddle } from "defuddle/node";

import type { ConvertedPage } from "./types";

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

export class ConvertError extends Error {
  constructor(
    readonly code: "invalid_url" | "fetch_failed" | "empty_content",
    readonly status: number
  ) {
    super(code);
  }
}

export function parseHttpUrl(input: unknown): URL {
  if (typeof input !== "string") throw new ConvertError("invalid_url", 400);
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    throw new ConvertError("invalid_url", 400);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new ConvertError("invalid_url", 400);
  }
  return url;
}

async function fetchHtml(url: URL): Promise<string> {
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { "user-agent": BROWSER_UA, accept: "text/html,*/*" },
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new ConvertError("fetch_failed", 502);
  }
  if (!res.ok) throw new ConvertError("fetch_failed", 502);
  return res.text();
}

export async function convertPage(input: unknown): Promise<ConvertedPage> {
  const url = parseHttpUrl(input);
  const html = await fetchHtml(url);

  const { document } = parseHTML(html);
  const result = await Defuddle(document, url.href, { markdown: true });

  const markdown = (result.content ?? "").trim();
  if (!markdown) throw new ConvertError("empty_content", 422);

  return {
    title: result.title?.trim() || "",
    author: result.author?.trim() || "",
    site: result.site?.trim() || "",
    host: url.hostname,
    markdown,
  };
}
