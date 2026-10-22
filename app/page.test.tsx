import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import Home from "@/app/page";

const PAGE = {
  title: "Obsidian을 3년 쓰고 나서야 알게 된 파일 중심 노트 정리법",
  author: "김도윤",
  site: "Dev Notes",
  host: "dev-notes.example.com",
  markdown:
    "## 1. 파일이 앱보다 오래간다\n\n노트는 **파일**로 둡니다.\n\n- 첫째\n- 둘째\n",
};

function mockConvert(
  respond: () => Response | Promise<Response> = () => Response.json(PAGE)
) {
  const fn = vi.fn(async () => respond());
  vi.stubGlobal("fetch", fn);
  return fn;
}

async function convertUrl(url = "https://dev-notes.example.com/posts/a") {
  fireEvent.change(screen.getByLabelText("웹 페이지 URL"), {
    target: { value: url },
  });
  fireEvent.click(screen.getByRole("button", { name: "변환" }));
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test("처음에는 빈 상태 안내가 보이고 결과와 지우기는 없다", () => {
  render(<Home />);

  expect(screen.getByText("아직 변환한 페이지가 없습니다")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "지우기" })).toBeDisabled();
  expect(screen.queryByRole("button", { name: "복사하기" })).toBeNull();
});

test("URL을 변환하면 제목·저자 헤더와 렌더링된 Markdown이 나타난다", async () => {
  const fetchMock = mockConvert();
  render(<Home />);

  await convertUrl();

  expect(
    await screen.findByRole("heading", { level: 2, name: PAGE.title })
  ).toBeInTheDocument();
  expect(screen.getByText("김도윤")).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { level: 3, name: "1. 파일이 앱보다 오래간다" })
  ).toBeInTheDocument();
  expect(screen.getByText("파일", { selector: "strong" })).toBeInTheDocument();
  expect(screen.getAllByRole("listitem")).toHaveLength(2);

  const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
  expect(JSON.parse(init.body as string)).toEqual({
    url: "https://dev-notes.example.com/posts/a",
  });
});

test("변환 중에는 버튼이 잠기고 중복 실행되지 않는다", async () => {
  let release!: (res: Response) => void;
  const fetchMock = mockConvert(
    () => new Promise<Response>((resolve) => (release = resolve))
  );
  render(<Home />);

  await convertUrl();

  const busy = await screen.findByRole("button", { name: /변환 중/ });
  expect(busy).toBeDisabled();
  fireEvent.click(busy);
  expect(fetchMock).toHaveBeenCalledTimes(1);

  release(Response.json(PAGE));
  expect(await screen.findByText(PAGE.title)).toBeInTheDocument();
});

test("저자가 없으면 저자 항목을 숨기고 제목이 없으면 호스트를 보여준다", async () => {
  mockConvert(() => Response.json({ ...PAGE, title: "", author: "" }));
  render(<Home />);

  await convertUrl();

  expect(
    await screen.findByRole("heading", { level: 2, name: PAGE.host })
  ).toBeInTheDocument();
  expect(screen.queryByText("undefined")).toBeNull();
  expect(screen.queryByText("김도윤")).toBeNull();
});

test("http·https가 아닌 입력은 요청 없이 형식 오류를 알리고 이전 결과를 지운다", async () => {
  const fetchMock = mockConvert();
  render(<Home />);
  await convertUrl();
  await screen.findByText(PAGE.title);

  await convertUrl("abc");

  expect(
    screen.getByText("http:// 또는 https://로 시작하는 올바른 URL을 입력해 주세요.")
  ).toBeInTheDocument();
  expect(screen.getByLabelText("웹 페이지 URL")).toHaveAttribute(
    "aria-invalid",
    "true"
  );
  expect(screen.queryByText(PAGE.title)).toBeNull();
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

test.each([
  ["fetch_failed", 502, "페이지를 가져오지 못했습니다"],
  ["empty_content", 422, "본문을 찾지 못했습니다"],
])("서버가 %s를 돌려주면 원인이 구분되는 안내를 보여준다", async (error, status, heading) => {
  mockConvert(() => Response.json({ error }, { status }));
  render(<Home />);

  await convertUrl();

  expect(await screen.findByRole("alert")).toHaveTextContent(heading);
  expect(screen.queryByRole("button", { name: "복사하기" })).toBeNull();
});

test("오류 뒤에도 이전 결과는 남지 않는다", async () => {
  const responses = [
    () => Response.json(PAGE),
    () => Response.json({ error: "fetch_failed" }, { status: 502 }),
  ];
  mockConvert(() => responses.shift()!());
  render(<Home />);

  await convertUrl();
  await screen.findByText(PAGE.title);
  await convertUrl("https://down.example.com/a");

  expect(await screen.findByRole("alert")).toBeInTheDocument();
  expect(screen.queryByText(PAGE.title)).toBeNull();
});

test("지우기를 누르면 입력과 결과가 모두 초기 상태로 돌아간다", async () => {
  mockConvert();
  render(<Home />);
  await convertUrl();
  await screen.findByText(PAGE.title);

  fireEvent.click(screen.getByRole("button", { name: "지우기" }));

  expect(screen.getByLabelText("웹 페이지 URL")).toHaveValue("");
  expect(screen.queryByText(PAGE.title)).toBeNull();
  expect(screen.getByText("아직 변환한 페이지가 없습니다")).toBeInTheDocument();
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "지우기" })).toBeDisabled()
  );
});

// ── 내보내기 ──

function mockClipboard(writeText = vi.fn().mockResolvedValue(undefined)) {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
  return writeText;
}

async function renderResult() {
  mockConvert();
  render(<Home />);
  await convertUrl();
  await screen.findByText(PAGE.title);
}

test("복사하기는 변환된 Markdown을 클립보드에 넣고 성공을 알린다", async () => {
  const writeText = mockClipboard();
  await renderResult();

  fireEvent.click(screen.getByRole("button", { name: "복사하기" }));

  expect(writeText).toHaveBeenCalledWith(PAGE.markdown);
  expect(await screen.findByRole("button", { name: "복사됨" })).toBeInTheDocument();
});

test(".md 다운로드는 제목으로 만든 파일명에 같은 Markdown을 담는다", async () => {
  let blob: Blob | undefined;
  vi.stubGlobal(
    "URL",
    Object.assign(URL, {
      createObjectURL: vi.fn((b: Blob) => ((blob = b), "blob:test")),
      revokeObjectURL: vi.fn(),
    })
  );
  const clicked: string[] = [];
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
    this: HTMLAnchorElement
  ) {
    clicked.push(this.download);
  });
  await renderResult();

  fireEvent.click(screen.getByRole("button", { name: ".md 다운로드" }));

  expect(clicked).toEqual([`${PAGE.title}.md`]);
  expect(await blob!.text()).toBe(PAGE.markdown);
});

test("프롬프트를 고르지 않고 ChatGPT로 열면 본문을 복사하고 빈 새 대화를 연다", async () => {
  const writeText = mockClipboard();
  const open = vi.spyOn(window, "open").mockReturnValue(null);
  await renderResult();

  fireEvent.click(screen.getByRole("button", { name: "ChatGPT로 열기" }));

  expect(open).toHaveBeenCalledWith(
    "https://chatgpt.com/",
    "_blank",
    "noopener,noreferrer"
  );
  expect(writeText).toHaveBeenCalledWith(PAGE.markdown);
  expect(await screen.findByRole("status")).toHaveTextContent(
    "본문이 복사되었습니다"
  );
  expect(screen.getByRole("status")).toHaveTextContent("붙여넣기");
});

test("프리셋을 고르고 Claude로 열면 프롬프트가 주소에 담긴다", async () => {
  mockClipboard();
  const open = vi.spyOn(window, "open").mockReturnValue(null);
  await renderResult();

  fireEvent.click(screen.getByRole("button", { name: "요약해줘" }));
  expect(screen.getByRole("button", { name: "요약해줘" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  fireEvent.click(screen.getByRole("button", { name: "Claude로 열기" }));

  expect(open).toHaveBeenCalledWith(
    "https://claude.ai/new?q=%EC%9A%94%EC%95%BD%ED%95%B4%EC%A4%98",
    "_blank",
    "noopener,noreferrer"
  );
});

test("직접 입력을 고르면 입력란이 나타나고 입력한 문장이 쓰인다", async () => {
  mockClipboard();
  const open = vi.spyOn(window, "open").mockReturnValue(null);
  await renderResult();
  expect(screen.queryByLabelText("직접 입력한 프롬프트")).toBeNull();

  fireEvent.click(screen.getByRole("button", { name: "직접 입력" }));
  fireEvent.change(screen.getByLabelText("직접 입력한 프롬프트"), {
    target: { value: "핵심만 정리해줘" },
  });
  fireEvent.click(screen.getByRole("button", { name: "ChatGPT로 열기" }));

  expect(open).toHaveBeenCalledWith(
    `https://chatgpt.com/?q=${encodeURIComponent("핵심만 정리해줘")}`,
    "_blank",
    "noopener,noreferrer"
  );

  fireEvent.click(screen.getByRole("button", { name: "쉽게 설명해줘" }));
  expect(screen.queryByLabelText("직접 입력한 프롬프트")).toBeNull();
});

test("직접 입력 문장은 저장되지 않고 지우기로 비워진다", async () => {
  mockClipboard();
  await renderResult();
  fireEvent.click(screen.getByRole("button", { name: "직접 입력" }));
  fireEvent.change(screen.getByLabelText("직접 입력한 프롬프트"), {
    target: { value: "한 줄로 요약" },
  });

  fireEvent.click(screen.getByRole("button", { name: "지우기" }));
  await convertUrl();
  await screen.findByText(PAGE.title);

  expect(screen.getByLabelText("직접 입력한 프롬프트")).toHaveValue("");
  expect(localStorage.length).toBe(0);
});

test("클립보드 복사가 막히면 안내가 실패를 알린다", async () => {
  mockClipboard(vi.fn().mockRejectedValue(new Error("denied")));
  vi.spyOn(window, "open").mockReturnValue(null);
  await renderResult();

  fireEvent.click(screen.getByRole("button", { name: "Claude로 열기" }));

  expect(await screen.findByRole("status")).toHaveTextContent(
    "복사하지 못했습니다"
  );
});

test("프롬프트를 바꾸면 이전 열기 안내는 사라진다", async () => {
  mockClipboard();
  vi.spyOn(window, "open").mockReturnValue(null);
  await renderResult();
  fireEvent.click(screen.getByRole("button", { name: "ChatGPT로 열기" }));
  await screen.findByRole("status");

  fireEvent.click(screen.getByRole("button", { name: "쉽게 설명해줘" }));

  expect(screen.queryByRole("status")).toBeNull();
});

test("클립보드 복사가 막히면 복사하기 버튼은 복사됨으로 바뀌지 않는다", async () => {
  mockClipboard(vi.fn().mockRejectedValue(new Error("denied")));
  await renderResult();

  fireEvent.click(screen.getByRole("button", { name: "복사하기" }));

  await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalled());
  await new Promise((r) => setTimeout(r, 20));
  expect(screen.queryByRole("button", { name: "복사됨" })).toBeNull();
  expect(screen.getByRole("button", { name: "복사하기" })).toBeInTheDocument();
});
