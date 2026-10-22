export type ConvertedPage = {
  title: string;
  author: string;
  site: string;
  host: string;
  markdown: string;
};

export type ConvertErrorCode = "invalid_url" | "fetch_failed" | "empty_content";
