import { db } from "@/db";
import { fanReports } from "@/db/schema";
import { triageReport } from "@/lib/genai";

export const dynamic = "force-dynamic";

const allowedCategories = ["Crowding", "Accessibility", "Transport", "Sustainability", "Safety", "Wayfinding"];
const allowedSeverities = ["low", "medium", "high", "critical"];

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const reporterType = typeof body.reporterType === "string" ? body.reporterType.slice(0, 40) : "fan";
    const location = typeof body.location === "string" ? body.location.trim().slice(0, 120) : "";
    const category = typeof body.category === "string" && allowedCategories.includes(body.category) ? body.category : "Wayfinding";
    const severity = typeof body.severity === "string" && allowedSeverities.includes(body.severity) ? body.severity : "medium";
    const language = typeof body.language === "string" ? body.language.slice(0, 12) : "en";
    const description = typeof body.description === "string" ? body.description.trim().slice(0, 1000) : "";

    if (location.length < 2 || description.length < 5) {
      return Response.json(
        { ok: false, error: "Please include a location and a short description." },
        { status: 400 },
      );
    }

    const aiTriage = triageReport({ reporterType, location, category, severity, description });
    const [report] = await db
      .insert(fanReports)
      .values({ reporterType, location, category, severity, language, description, aiTriage })
      .returning();

    return Response.json({ ok: true, report });
  } catch {
    return Response.json({ ok: false, error: "Unable to save the report right now." }, { status: 500 });
  }
}
