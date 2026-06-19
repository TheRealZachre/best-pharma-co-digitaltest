import { generatePowerPointBuffer } from "@/lib/export-pptx";
import { requireSession } from "@/lib/auth/session";
import type { ReportPptxPayload } from "@/lib/export-pptx-types";

export const runtime = "nodejs";

interface ExportPptxRequest {
  payload: ReportPptxPayload;
  filename?: string;
}

export async function POST(request: Request) {
  const { response } = await requireSession();
  if (response) return response;

  try {
    const body = (await request.json()) as ExportPptxRequest;
    const { payload, filename = "report.pptx" } = body;

    if (!payload?.posts || !payload.title) {
      return Response.json({ error: "Invalid export payload" }, { status: 400 });
    }

    const origin = new URL(request.url).origin;
    const buffer = await generatePowerPointBuffer(payload, { imageOrigin: origin });
    const safeFilename = filename.replace(/[^\w.-]+/g, "_");

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${safeFilename}"`,
        "Content-Length": String(buffer.length),
      },
    });
  } catch (error) {
    console.error("PowerPoint export failed:", error);
    return Response.json(
      { error: "Failed to generate PowerPoint export" },
      { status: 500 }
    );
  }
}
