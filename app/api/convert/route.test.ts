// @vitest-environment node
import { afterEach, expect, test, vi } from "vitest";

import { POST } from "@/app/api/convert/route";

const ARTICLE_HTML = `<html><head><title>Hello World - Dev Notes</title>
<meta name="author" content="김도윤">
<meta property="og:site_name" content="Dev Notes"></head><body>
<nav>메뉴</nav><article><h1>Hello World</h1>
<p>노트는 <b>파일</b>이 앱보다 오래갑니다. <a href="/more">더 보기</a></p>
<ul><li>하나</li><li>둘</li></ul>
<p>${"본문이 충분히 길어야 추출기가 글로 인식합니다. ".repeat(30)}</p>
</article><footer>푸터</footer></body></html>`;

function stubFetch(impl: () => Promise<Response>) {
  vi.stubGlobal("fetch", vi.fn(impl));
}

function convert(url: unknown) {
  return POST(
    new Request("http://localhost/api/convert", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url }),
    })
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

test("기사 URL을 보내면 제목·저자·Markdown 본문을 돌려준다", async () => {
  stubFetch(async () => new Response(ARTICLE_HTML, { status: 200 }));

  const res = await convert("https://dev-notes.example.com/posts/hello");
  const body = await res.json();

  expect(res.status).toBe(200);
  expect(body.title).toBe("Hello World");
  expect(body.author).toBe("김도윤");
  expect(body.host).toBe("dev-notes.example.com");
  expect(body.markdown).toContain("**파일**");
  expect(body.markdown).toContain("[더 보기](https://dev-notes.example.com/more)");
  expect(body.markdown).not.toContain("메뉴");
});

test.each(["ftp://example.com/a", "not a url", "", 42, null])(
  "http·https가 아닌 입력(%j)은 invalid_url(400)로 거절한다",
  async (input) => {
    const res = await convert(input);

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalid_url" });
  }
);

test("접속 실패와 비정상 응답은 fetch_failed(502)로 구분해 알린다", async () => {
  stubFetch(async () => {
    throw new TypeError("fetch failed");
  });
  const unreachable = await convert("https://down.example.com/a");
  expect(unreachable.status).toBe(502);
  expect(await unreachable.json()).toEqual({ error: "fetch_failed" });

  stubFetch(async () => new Response("nope", { status: 503 }));
  const badStatus = await convert("https://down.example.com/b");
  expect(badStatus.status).toBe(502);
  expect(await badStatus.json()).toEqual({ error: "fetch_failed" });
});

test("읽을 본문이 없는 페이지는 empty_content(422)로 알린다", async () => {
  stubFetch(
    async () =>
      new Response("<html><head><title>x</title></head><body></body></html>", {
        status: 200,
      })
  );

  const res = await convert("https://empty.example.com/a");

  expect(res.status).toBe(422);
  expect(await res.json()).toEqual({ error: "empty_content" });
});
