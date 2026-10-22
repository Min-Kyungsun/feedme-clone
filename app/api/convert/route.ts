import { ConvertError, convertPage } from "@/features/page-conversion/server";

export async function POST(request: Request) {
  let url: unknown;
  try {
    ({ url } = await request.json());
  } catch {
    return Response.json({ error: "invalid_url" }, { status: 400 });
  }

  try {
    return Response.json(await convertPage(url));
  } catch (error) {
    if (error instanceof ConvertError) {
      return Response.json({ error: error.code }, { status: error.status });
    }
    return Response.json({ error: "fetch_failed" }, { status: 502 });
  }
}
