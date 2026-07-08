import {
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const stadiumZones = pgTable(
  "stadium_zones",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    zoneType: text("zone_type").notNull(),
    currentDensity: integer("current_density").notNull(),
    capacity: integer("capacity").notNull(),
    waitMinutes: integer("wait_minutes").notNull(),
    accessibilityNotes: text("accessibility_notes").notNull(),
    multilingualHint: text("multilingual_hint").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("stadium_zones_name_idx").on(table.name)],
);

export const transitUpdates = pgTable(
  "transit_updates",
  {
    id: serial("id").primaryKey(),
    mode: text("mode").notNull(),
    title: text("title").notNull(),
    status: text("status").notNull(),
    etaMinutes: integer("eta_minutes").notNull(),
    crowdLevel: text("crowd_level").notNull(),
    carbonSavedKg: numeric("carbon_saved_kg", { precision: 8, scale: 2 }).notNull(),
    recommendation: text("recommendation").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("transit_updates_title_idx").on(table.title)],
);

export const fanReports = pgTable("fan_reports", {
  id: serial("id").primaryKey(),
  reporterType: text("reporter_type").notNull(),
  location: text("location").notNull(),
  category: text("category").notNull(),
  severity: text("severity").notNull(),
  language: text("language").notNull(),
  description: text("description").notNull(),
  aiTriage: text("ai_triage").notNull(),
  status: text("status").default("open").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const aiBriefings = pgTable("ai_briefings", {
  id: serial("id").primaryKey(),
  audience: text("audience").notNull(),
  language: text("language").notNull(),
  question: text("question").notNull(),
  response: text("response").notNull(),
  model: text("model").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
