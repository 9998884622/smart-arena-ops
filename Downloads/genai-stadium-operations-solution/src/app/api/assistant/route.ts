import { db } from "@/db";
import { aiBriefings } from "@/db/schema";
import { generateOperationsBrief } from "@/lib/genai";

export const dynamic = "force-dynamic";

const validAudiences = ["fan", "organizer", "volunteer", "venue-staff"] as const;
type Audience = (typeof validAudiences)[number];

function isAudience(value: unknown): value is Audience {
  return typeof value === "string" && validAudiences.includes(value as Audience);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      audience?: unknown;
      language?: unknown;
      question?: unknown;
    };

    const audience = isAudience(body.audience) ? body.audience : "fan";
    const language = typeof body.language === "string" ? body.language.slice(0, 12) : "en";
    const question = typeof body.question === "string" ? body.question.trim().slice(0, 1000) : "";

    if (question.length < 3) {
      return Response.json(
        { ok: false, error: "Ask a specific navigation, operations, accessibility, transit, or crowd question." },
        { status: 400 },
      );
    }

    const { response, model } = await generateOperationsBrief({ audience, language, question });

    const [briefing] = await db
      .insert(aiBriefings)
      .values({ audience, language, question, response, model })
      .returning();

    return Response.json({ ok: true, briefing });
  } catch {
    return Response.json({ ok: false, error: "Unable to generate a briefing right now." }, { status: 500 });
  }
}
