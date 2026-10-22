import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

// react-markdown이 넘기는 node prop은 DOM에 내려보내지 않는다.
function dom<T extends { node?: unknown }>(props: T): Omit<T, "node"> {
  const rest = { ...props };
  delete rest.node;
  return rest;
}

type WithNode<T> = T & { node?: unknown };

// 페이지 제목이 h2이므로 본문 제목은 h3부터 시작한다.
const heading = (Tag: "h3" | "h4" | "h5" | "h6", className: string) =>
  function Heading(props: WithNode<React.ComponentProps<"h3">>) {
    return <Tag className={cn("font-semibold", className)} {...dom(props)} />;
  };

const components: Components = {
  h1: heading("h3", "mt-8 mb-3 text-xl"),
  h2: heading("h3", "mt-8 mb-3 text-xl"),
  h3: heading("h4", "mt-6 mb-2 text-lg"),
  h4: heading("h5", "mt-5 mb-2 text-base"),
  h5: heading("h6", "mt-4 mb-2 text-sm"),
  h6: heading("h6", "mt-4 mb-2 text-sm"),
  p: (props) => <p className="mb-4" {...dom(props)} />,
  a: (props) => (
    <a
      className="underline underline-offset-4"
      target="_blank"
      rel="noopener noreferrer"
      {...dom(props)}
    />
  ),
  ul: (props) => <ul className="mb-4 list-disc pl-6" {...dom(props)} />,
  ol: (props) => <ol className="mb-4 list-decimal pl-6" {...dom(props)} />,
  li: (props) => <li className="my-1" {...dom(props)} />,
  blockquote: (props) => (
    <blockquote
      className="mb-4 border-l-2 pl-4 text-muted-foreground"
      {...dom(props)}
    />
  ),
  pre: (props) => (
    <pre
      className="mb-4 overflow-x-auto rounded-md bg-muted p-4 text-sm leading-relaxed"
      {...dom(props)}
    />
  ),
  code: ({ className, ...props }) => (
    <code
      className={cn(
        "font-mono text-[0.875em] [:not(pre)>&]:rounded-md [:not(pre)>&]:bg-muted [:not(pre)>&]:px-1.5 [:not(pre)>&]:py-0.5",
        className
      )}
      {...dom(props)}
    />
  ),
  table: (props) => (
    <div className="mb-4 overflow-x-auto">
      <table className="w-full border-collapse text-sm" {...dom(props)} />
    </div>
  ),
  th: (props) => (
    <th className="border-b px-3 py-2 text-left font-semibold" {...dom(props)} />
  ),
  td: (props) => <td className="border-b px-3 py-2" {...dom(props)} />,
  hr: (props) => <hr className="my-6" {...dom(props)} />,
  img: ({ alt, ...props }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="mb-4 h-auto max-w-full rounded-md"
      alt={alt ?? ""}
      {...dom(props)}
    />
  ),
};

// react-markdown은 원시 HTML을 렌더하지 않으므로 본문의 HTML은 그대로 삽입되지 않는다.
export function MarkdownView({ markdown }: { markdown: string }) {
  return (
    <div className="text-[0.9375rem] leading-7 wrap-anywhere [&>:first-child]:mt-0 [&>:last-child]:mb-0">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
