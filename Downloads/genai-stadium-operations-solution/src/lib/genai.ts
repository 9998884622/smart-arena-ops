import { buildOperationalContext, getDashboardSnapshot } from "@/lib/ops-data";

type AiAudience = "fan" | "organizer" | "volunteer" | "venue-staff";

const languageNames: Record<string, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  ar: "Arabic",
  pt: "Portuguese",
  ja: "Japanese",
  ko: "Korean",
};

function getLanguageName(language: string) {
  return languageNames[language] ?? language;
}

function getAudienceInstruction(audience: AiAudience) {
  switch (audience) {
    case "organizer":
      return "prioritize operational intelligence, staffing decisions, crowd balancing, and escalation paths";
    case "volunteer":
      return "give concise instructions that a volunteer can say or do immediately, including multilingual phrasing";
    case "venue-staff":
      return "focus on safety, accessibility, queue operations, dispatchable tasks, and incident triage";
    case "fan":
    default:
      return "help the fan navigate safely, reduce waits, choose sustainable transport, and access services";
  }
}

function buildFallbackResponse(params: {
  audience: AiAudience;
  language: string;
  question: string;
  context: string;
}) {
  const question = params.question.toLowerCase();
  const language = getLanguageName(params.language);
  const accessibility = question.includes("accessible") || question.includes("wheelchair") || question.includes("elevator");
  const transit = question.includes("train") || question.includes("metro") || question.includes("bus") || question.includes("transport");
  const crowd = question.includes("crowd") || question.includes("queue") || question.includes("gate") || question.includes("line");

  const priority = accessibility
    ? "Route guests through Section 128 Accessible Seating and Elevator E2, then confirm step-free access before moving them toward dense areas."
    : transit
      ? "Promote Blue Line East exit for speed, Park-and-Ride P4 for accessible family transfers, and Greenway Fan Trail for low-carbon dispersal."
      : crowd
        ? "Divert arrivals away from South Fan Fest Bridge and Gate A until waits drop below 15 minutes; add bilingual volunteers at the pressure points."
        : "Balance fan flow between Gate A, the North Plaza, and the Greenway Fan Trail while keeping accessible services visible.";

  return [
    `AI operations brief (${language}, ${params.audience})`,
    priority,
    "Recommended action: send a multilingual push notification, deploy two volunteer pods, and re-check density in 10 minutes.",
    "Accessibility note: keep step-free routes, sensory support, and low-counter concession options in the first instruction rather than as a follow-up.",
    "Sustainability note: suggest metro, park-and-ride, or walking routes before private vehicle options.",
  ].join("\n\n");
}

export async function generateOperationsBrief(params: {
  audience: AiAudience;
  language: string;
  question: string;
}) {
  const snapshot = await getDashboardSnapshot();
  const context = buildOperationalContext(snapshot);
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const apiKey = process.env.OPENAI_API_KEY;
  const language = getLanguageName(params.language);

  if (!apiKey) {
    return {
      response: buildFallbackResponse({ ...params, context }),
      model: "local-rule-based-genai-fallback",
    };
  }

  try {
    const completion = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.35,
        messages: [
          {
            role: "system",
            content: `You are StadiumFlow AI, a FIFA World Cup 2026 real-time decision-support copilot. Respond in ${language}. Use the operational context only as live facts. Be concise, specific, safety-aware, accessible, sustainable, and multilingual when helpful. For the selected audience, ${getAudienceInstruction(params.audience)}. Include immediate next steps and avoid inventing exact data not present in context.`,
          },
          {
            role: "user",
            content: `${context}\n\nRequest: ${params.question}`,
          },
        ],
      }),
    });

    if (!completion.ok) {
      throw new Error(`OpenAI request failed with ${completion.status}`);
    }

    const payload = (await completion.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const response = payload.choices?.[0]?.message?.content?.trim();

    if (!response) {
      throw new Error("OpenAI response did not include content");
    }

    return { response, model };
  } catch {
    return {
      response: buildFallbackResponse({ ...params, context }),
      model: "local-rule-based-genai-fallback",
    };
  }
}

export function triageReport(params: {
  reporterType: string;
  location: string;
  category: string;
  severity: string;
  description: string;
}) {
  const urgent = params.severity === "critical" || /medical|crush|panic|fire|smoke|fight/i.test(params.description);
  const team =
    params.category === "Accessibility"
      ? "accessibility response lead"
      : params.category === "Crowding"
        ? "crowd-flow supervisor"
        : params.category === "Transport"
          ? "mobility command desk"
          : params.category === "Sustainability"
            ? "clean-team and waste diversion lead"
            : "guest services coordinator";

  return [
    urgent ? "Escalate immediately." : "Monitor and dispatch within 5 minutes.",
    `Assign to ${team} near ${params.location}.`,
    `Suggested message: Thank the ${params.reporterType}, confirm the issue, and provide the safest alternate route or service point.`,
  ].join(" ");
}
