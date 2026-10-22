import type { ConvertedPage, ConvertErrorCode } from "./types";

export class ConversionFailure extends Error {
  constructor(readonly code: ConvertErrorCode) {
    super(code);
  }
}

export function isHttpUrl(input: string): boolean {
  try {
    const { protocol } = new URL(input.trim());
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

export async function requestConversion(url: string): Promise<ConvertedPage> {
  let res: Response;
  try {
    res = await fetch("/api/convert", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: url.trim() }),
    });
  } catch {
    throw new ConversionFailure("fetch_failed");
  }

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const code = body?.error;
    throw new ConversionFailure(
      code === "invalid_url" || code === "empty_content" ? code : "fetch_failed"
    );
  }
  return body as ConvertedPage;
}
