"use client";

import type { DashboardSnapshot } from "@/lib/ops-data";
import { useMemo, useState, useTransition } from "react";

type Briefing = DashboardSnapshot["briefings"][number];
type Report = DashboardSnapshot["reports"][number];

type AssistantState = {
  audience: "fan" | "organizer" | "volunteer" | "venue-staff";
  language: string;
  question: string;
};

type ReportState = {
  reporterType: string;
  location: string;
  category: string;
  severity: string;
  language: string;
  description: string;
};

const quickPrompts = [
  "Find the fastest accessible route from Gate A to Section 128.",
  "What should volunteers do if the South Fan Fest Bridge stays crowded?",
  "Create a multilingual post-match transit message for fans using low-carbon options.",
  "Brief organizers on queue, accessibility, and transport risks for the next 20 minutes.",
];

const languages = [
  ["en", "English"],
  ["es", "Español"],
  ["fr", "Français"],
  ["ar", "العربية"],
  ["pt", "Português"],
  ["ja", "日本語"],
  ["ko", "한국어"],
];

function densityTone(percent: number) {
  if (percent >= 88) return "from-rose-500 to-orange-400";
  if (percent >= 76) return "from-amber-400 to-yellow-300";
  return "from-emerald-400 to-cyan-300";
}

function severityClass(severity: string) {
  switch (severity) {
    case "critical":
      return "bg-rose-100 text-rose-800 ring-rose-200";
    case "high":
      return "bg-orange-100 text-orange-800 ring-orange-200";
    case "medium":
      return "bg-amber-100 text-amber-800 ring-amber-200";
    default:
      return "bg-emerald-100 text-emerald-800 ring-emerald-200";
  }
}

export function WorldCupCommandCenter({ snapshot }: { snapshot: DashboardSnapshot }) {
  const [assistant, setAssistant] = useState<AssistantState>({
    audience: "fan",
    language: "en",
    question: quickPrompts[0],
  });
  const [report, setReport] = useState<ReportState>({
    reporterType: "fan",
    location: "Gate A - North Plaza",
    category: "Crowding",
    severity: "medium",
    language: "en",
    description: "Queue is spilling into the family lane and guests are asking for alternate entry guidance.",
  });
  const [briefings, setBriefings] = useState<Briefing[]>(snapshot.briefings);
  const [reports, setReports] = useState<Report[]>(snapshot.reports);
  const [assistantMessage, setAssistantMessage] = useState<string>(snapshot.briefings[0]?.response ?? "Ask StadiumFlow AI for real-time guidance tailored to fans, volunteers, organizers, or venue staff.");
  const [reportMessage, setReportMessage] = useState<string>("Submit a report to see AI triage and operational routing.");
  const [isAssistantPending, startAssistantTransition] = useTransition();
  const [isReportPending, startReportTransition] = useTransition();

  const highestDensityZone = useMemo(() => {
    return snapshot.zones.reduce((highest, zone) => {
      const zonePercent = zone.currentDensity / zone.capacity;
      const highestPercent = highest.currentDensity / highest.capacity;
      return zonePercent > highestPercent ? zone : highest;
    }, snapshot.zones[0]);
  }, [snapshot.zones]);

  function askAssistant() {
    startAssistantTransition(async () => {
      setAssistantMessage("Generating live decision support...");
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assistant),
      });
      const payload = (await response.json()) as { ok: boolean; briefing?: Briefing; error?: string };
      if (!response.ok || !payload.ok || !payload.briefing) {
        setAssistantMessage(payload.error ?? "The AI assistant could not respond.");
        return;
      }
      setAssistantMessage(payload.briefing.response);
      setBriefings((current) => [payload.briefing!, ...current].slice(0, 5));
    });
  }

  function submitReport() {
    startReportTransition(async () => {
      setReportMessage("Saving report and generating AI triage...");
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(report),
      });
      const payload = (await response.json()) as { ok: boolean; report?: Report; error?: string };
      if (!response.ok || !payload.ok || !payload.report) {
        setReportMessage(payload.error ?? "The report could not be saved.");
        return;
      }
      setReportMessage(payload.report.aiTriage);
      setReports((current) => [payload.report!, ...current].slice(0, 8));
    });
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#07111f] text-white">
      <div className="absolute inset-x-0 top-0 h-[560px] bg-[radial-gradient(circle_at_top_left,_rgba(41,196,255,0.35),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(255,64,129,0.28),_transparent_30%),linear-gradient(135deg,_#07111f_0%,_#0e1f35_55%,_#132d2b_100%)]" />
      <section className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-8 sm:px-8 lg:px-10">
        <nav className="flex flex-wrap items-center justify-between gap-4 rounded-full border border-white/10 bg-white/10 px-5 py-3 shadow-2xl shadow-cyan-950/20 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-full bg-white text-lg font-black text-slate-950">26</div>
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-cyan-200">FIFA World Cup 2026</p>
              <p className="font-semibold">StadiumFlow AI Command Center</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-slate-200">
            <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-emerald-100 ring-1 ring-emerald-300/25">GenAI navigation</span>
            <span className="rounded-full bg-cyan-400/15 px-3 py-1 text-cyan-100 ring-1 ring-cyan-300/25">Crowd intelligence</span>
            <span className="rounded-full bg-fuchsia-400/15 px-3 py-1 text-fuchsia-100 ring-1 ring-fuchsia-300/25">Multilingual support</span>
          </div>
        </nav>

        <header className="grid items-end gap-8 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-6">
            <div className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100">
              Real-time decision support for fans, organizers, volunteers, and venue staff
            </div>
            <div className="max-w-4xl space-y-5">
              <h1 className="text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
                A GenAI operations copilot for safer, greener matchdays.
              </h1>
              <p className="max-w-3xl text-lg leading-8 text-slate-200">
                StadiumFlow AI turns crowd density, transit status, accessibility notes, and field reports into instant route guidance, multilingual fan messages, volunteer scripts, and organizer briefings for the FIFA World Cup 2026.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              <MetricCard label="Venue occupancy" value={`${snapshot.metrics.occupancyPercent}%`} detail="across monitored zones" />
              <MetricCard label="Average wait" value={`${snapshot.metrics.averageWait}m`} detail="entry + services" />
              <MetricCard label="Open reports" value={`${reports.filter((item) => item.status === "open").length}`} detail="fan/staff signals" />
              <MetricCard label="CO₂ avoided" value={`${snapshot.metrics.transitCarbonSaved}kg`} detail="public + active transit" />
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-2xl shadow-black/20 backdrop-blur">
            <div className="rounded-[1.5rem] bg-slate-950/70 p-5 ring-1 ring-white/10">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">Live pressure point</p>
                  <h2 className="mt-1 text-2xl font-bold">{highestDensityZone.name}</h2>
                </div>
                <span className="rounded-full bg-rose-400/15 px-3 py-1 text-sm text-rose-100 ring-1 ring-rose-300/30">Needs balancing</span>
              </div>
              <div className="space-y-4">
                {snapshot.zones.map((zone) => {
                  const percent = Math.round((zone.currentDensity / zone.capacity) * 100);
                  return (
                    <div key={zone.id} className="rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/10">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-semibold text-slate-100">{zone.name}</span>
                        <span className="text-slate-300">{percent}% · {zone.waitMinutes}m</span>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                        <div className={`h-full rounded-full bg-gradient-to-r ${densityTone(percent)}`} style={{ width: `${Math.min(percent, 100)}%` }} />
                      </div>
                      <p className="mt-2 text-xs leading-5 text-slate-300">{zone.accessibilityNotes}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white p-5 text-slate-950 shadow-2xl shadow-black/20">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-700">Ask StadiumFlow AI</p>
                <h2 className="mt-2 text-3xl font-black">Multilingual operations brief</h2>
              </div>
              <div className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Server-side GenAI</div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <label className="space-y-2 text-sm font-semibold">
                Audience
                <select className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none ring-cyan-500 focus:ring-2" value={assistant.audience} onChange={(event) => setAssistant({ ...assistant, audience: event.target.value as AssistantState["audience"] })}>
                  <option value="fan">Fan</option>
                  <option value="organizer">Organizer</option>
                  <option value="volunteer">Volunteer</option>
                  <option value="venue-staff">Venue staff</option>
                </select>
              </label>
              <label className="space-y-2 text-sm font-semibold">
                Language
                <select className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none ring-cyan-500 focus:ring-2" value={assistant.language} onChange={(event) => setAssistant({ ...assistant, language: event.target.value })}>
                  {languages.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <button onClick={askAssistant} disabled={isAssistantPending} className="self-end rounded-2xl bg-cyan-500 px-5 py-3 font-bold text-slate-950 shadow-lg shadow-cyan-500/25 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60">
                {isAssistantPending ? "Generating..." : "Generate brief"}
              </button>
            </div>

            <label className="mt-4 block space-y-2 text-sm font-semibold">
              What do you need to decide?
              <textarea className="min-h-32 w-full rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 leading-7 text-slate-900 outline-none ring-cyan-500 focus:ring-2" value={assistant.question} onChange={(event) => setAssistant({ ...assistant, question: event.target.value })} />
            </label>

            <div className="mt-4 flex flex-wrap gap-2">
              {quickPrompts.map((prompt) => (
                <button key={prompt} onClick={() => setAssistant({ ...assistant, question: prompt })} className="rounded-full border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-700 transition hover:border-cyan-400 hover:text-cyan-700">
                  {prompt}
                </button>
              ))}
            </div>

            <article className="mt-5 whitespace-pre-line rounded-3xl bg-slate-950 p-5 text-sm leading-7 text-slate-100 shadow-inner shadow-black/30">
              {assistantMessage}
            </article>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-2xl shadow-black/20 backdrop-blur">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-200">Transport + sustainability</p>
                <h2 className="mt-2 text-3xl font-black">Low-carbon dispersal plan</h2>
              </div>
              <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-sm text-emerald-100 ring-1 ring-emerald-300/30">Live</span>
            </div>
            <div className="space-y-3">
              {snapshot.transit.map((item) => (
                <div key={item.id} className="rounded-3xl bg-white p-4 text-slate-950 shadow-lg shadow-black/10">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">{item.mode}</p>
                      <h3 className="mt-1 font-black">{item.title}</h3>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold">ETA {item.etaMinutes}m</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-700">{item.recommendation}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-cyan-50 px-3 py-1 text-cyan-800">{item.status}</span>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-800">{Number(item.carbonSavedKg).toLocaleString()} kg CO₂ saved</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white p-5 text-slate-950 shadow-2xl shadow-black/20">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-fuchsia-700">Field signal intake</p>
            <h2 className="mt-2 text-3xl font-black">Report an issue</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <input className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none ring-fuchsia-500 focus:ring-2" value={report.reporterType} onChange={(event) => setReport({ ...report, reporterType: event.target.value })} placeholder="Reporter type" />
              <input className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none ring-fuchsia-500 focus:ring-2" value={report.location} onChange={(event) => setReport({ ...report, location: event.target.value })} placeholder="Location" />
              <select className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none ring-fuchsia-500 focus:ring-2" value={report.category} onChange={(event) => setReport({ ...report, category: event.target.value })}>
                {[
                  "Crowding",
                  "Accessibility",
                  "Transport",
                  "Sustainability",
                  "Safety",
                  "Wayfinding",
                ].map((item) => <option key={item}>{item}</option>)}
              </select>
              <select className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none ring-fuchsia-500 focus:ring-2" value={report.severity} onChange={(event) => setReport({ ...report, severity: event.target.value })}>
                {[
                  "low",
                  "medium",
                  "high",
                  "critical",
                ].map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>
            <textarea className="mt-3 min-h-28 w-full rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 leading-7 outline-none ring-fuchsia-500 focus:ring-2" value={report.description} onChange={(event) => setReport({ ...report, description: event.target.value })} placeholder="Describe what is happening" />
            <button onClick={submitReport} disabled={isReportPending} className="mt-3 w-full rounded-2xl bg-fuchsia-500 px-5 py-3 font-bold text-white shadow-lg shadow-fuchsia-500/25 transition hover:bg-fuchsia-400 disabled:cursor-not-allowed disabled:opacity-60">
              {isReportPending ? "Triaging..." : "Submit report + AI triage"}
            </button>
            <p className="mt-4 rounded-3xl bg-fuchsia-50 p-4 text-sm leading-6 text-fuchsia-950">{reportMessage}</p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-2xl shadow-black/20 backdrop-blur">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-200">Operational memory</p>
                <h2 className="mt-2 text-3xl font-black">Recent AI triage + briefings</h2>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-slate-200 ring-1 ring-white/10">PostgreSQL-backed</span>
            </div>
            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              <div className="space-y-3">
                <h3 className="font-bold text-cyan-100">Reports</h3>
                {reports.length === 0 ? <EmptyState text="No reports yet. Submit one to populate live triage." /> : reports.map((item) => (
                  <article key={item.id} className="rounded-3xl bg-white p-4 text-slate-950">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-black">{item.category}</span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${severityClass(item.severity)}`}>{item.severity}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-700">{item.location}</p>
                    <p className="mt-2 text-sm leading-6">{item.description}</p>
                    <p className="mt-3 rounded-2xl bg-slate-100 p-3 text-xs leading-5 text-slate-700">{item.aiTriage}</p>
                  </article>
                ))}
              </div>
              <div className="space-y-3">
                <h3 className="font-bold text-cyan-100">AI briefings</h3>
                {briefings.length === 0 ? <EmptyState text="No AI briefings yet. Generate one above." /> : briefings.map((item) => (
                  <article key={item.id} className="rounded-3xl bg-slate-950/80 p-4 ring-1 ring-white/10">
                    <div className="flex flex-wrap gap-2 text-xs font-semibold">
                      <span className="rounded-full bg-cyan-400/15 px-2.5 py-1 text-cyan-100">{item.audience}</span>
                      <span className="rounded-full bg-white/10 px-2.5 py-1 text-slate-200">{item.language}</span>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-white">{item.question}</p>
                    <p className="mt-2 line-clamp-4 whitespace-pre-line text-sm leading-6 text-slate-300">{item.response}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/10 p-4 shadow-lg shadow-black/10 backdrop-blur">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-300">{label}</p>
      <p className="mt-2 text-3xl font-black text-white">{value}</p>
      <p className="mt-1 text-sm text-slate-300">{detail}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-3xl border border-dashed border-white/20 p-5 text-sm text-slate-300">{text}</div>;
}
