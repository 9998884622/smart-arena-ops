import { db } from "@/db";
import { aiBriefings, fanReports, stadiumZones, transitUpdates } from "@/db/schema";
import { desc, sql } from "drizzle-orm";

const seededZones = [
  {
    name: "Gate A - North Plaza",
    zoneType: "Entry",
    currentDensity: 7100,
    capacity: 9000,
    waitMinutes: 18,
    accessibilityNotes: "Step-free lane A3 is open; sensory support desk is 60m inside the gate.",
    multilingualHint: "Use Spanish and English signage for Mexico vs. Canada arrivals.",
  },
  {
    name: "Concourse 212 Food Market",
    zoneType: "Concession",
    currentDensity: 4300,
    capacity: 5200,
    waitMinutes: 14,
    accessibilityNotes: "Low-counter service available at kiosks 4 and 9.",
    multilingualHint: "Arabic, French, and English menu cards are being requested most often.",
  },
  {
    name: "Section 128 Accessible Seating",
    zoneType: "Accessibility",
    currentDensity: 620,
    capacity: 900,
    waitMinutes: 4,
    accessibilityNotes: "Elevator E2 has normal flow; wheelchair battery charging points are available.",
    multilingualHint: "Volunteer translation demand is highest for Portuguese and Japanese.",
  },
  {
    name: "South Fan Fest Bridge",
    zoneType: "Pedestrian Flow",
    currentDensity: 9800,
    capacity: 11000,
    waitMinutes: 22,
    accessibilityNotes: "Golf cart shuttle is paused because pedestrian density is high.",
    multilingualHint: "Push wayfinding in English, Spanish, French, and Korean.",
  },
];

const seededTransit = [
  {
    mode: "Metro",
    title: "Blue Line to Stadium Station",
    status: "High demand",
    etaMinutes: 6,
    crowdLevel: "busy",
    carbonSavedKg: "1840.50",
    recommendation: "Send fans with mobile tickets to Stadium Station East exit; add three bilingual volunteers.",
  },
  {
    mode: "Bus",
    title: "Park-and-Ride Express P4",
    status: "On schedule",
    etaMinutes: 11,
    crowdLevel: "moderate",
    carbonSavedKg: "920.00",
    recommendation: "Promote P4 for families and accessible shuttle transfers after minute 75.",
  },
  {
    mode: "Bike / Walk",
    title: "Greenway Fan Trail",
    status: "Open",
    etaMinutes: 16,
    crowdLevel: "light",
    carbonSavedKg: "310.25",
    recommendation: "Offer post-match walking route with lighting, hydration, and multilingual stewards.",
  },
];

export type DashboardSnapshot = Awaited<ReturnType<typeof getDashboardSnapshot>>;

export async function ensureOperationalSeedData() {
  await db
    .insert(stadiumZones)
    .values(seededZones)
    .onConflictDoNothing({ target: stadiumZones.name });

  await db
    .insert(transitUpdates)
    .values(seededTransit)
    .onConflictDoNothing({ target: transitUpdates.title });
}

export async function getDashboardSnapshot() {
  await ensureOperationalSeedData();

  const [zones, transit, reports, briefings, reportCounts] = await Promise.all([
    db.select().from(stadiumZones).orderBy(desc(stadiumZones.currentDensity)),
    db.select().from(transitUpdates).orderBy(transitUpdates.etaMinutes),
    db.select().from(fanReports).orderBy(desc(fanReports.createdAt)).limit(8),
    db.select().from(aiBriefings).orderBy(desc(aiBriefings.createdAt)).limit(5),
    db
      .select({
        category: fanReports.category,
        count: sql<number>`cast(count(*) as int)`,
      })
      .from(fanReports)
      .groupBy(fanReports.category),
  ]);

  const totalCapacity = zones.reduce((sum, zone) => sum + zone.capacity, 0);
  const totalDensity = zones.reduce((sum, zone) => sum + zone.currentDensity, 0);
  const averageWait = Math.round(
    zones.reduce((sum, zone) => sum + zone.waitMinutes, 0) / Math.max(zones.length, 1),
  );
  const transitCarbonSaved = transit.reduce(
    (sum, item) => sum + Number(item.carbonSavedKg),
    0,
  );

  return {
    zones,
    transit,
    reports,
    briefings,
    reportCounts,
    metrics: {
      occupancyPercent: Math.round((totalDensity / Math.max(totalCapacity, 1)) * 100),
      averageWait,
      openReports: reports.filter((report) => report.status === "open").length,
      transitCarbonSaved: Math.round(transitCarbonSaved),
    },
  };
}

export function buildOperationalContext(snapshot: DashboardSnapshot) {
  const zones = snapshot.zones
    .map(
      (zone) =>
        `${zone.name}: ${zone.currentDensity}/${zone.capacity} people, ${zone.waitMinutes} min wait, ${zone.accessibilityNotes}`,
    )
    .join("\n");
  const transit = snapshot.transit
    .map(
      (item) =>
        `${item.mode} - ${item.title}: ${item.status}, ETA ${item.etaMinutes} min, ${item.crowdLevel}, ${item.recommendation}`,
    )
    .join("\n");
  const reports = snapshot.reports
    .map(
      (report) =>
        `${report.severity} ${report.category} at ${report.location}: ${report.description}. Triage: ${report.aiTriage}`,
    )
    .join("\n") || "No active fan or staff reports yet.";

  return `FIFA World Cup 2026 stadium operations context\nOccupancy: ${snapshot.metrics.occupancyPercent}%\nAverage entry/wait: ${snapshot.metrics.averageWait} minutes\nEstimated transit CO2 saved today: ${snapshot.metrics.transitCarbonSaved} kg\n\nZones:\n${zones}\n\nTransit:\n${transit}\n\nRecent reports:\n${reports}`;
}
