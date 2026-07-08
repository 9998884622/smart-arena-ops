import { WorldCupCommandCenter } from "@/components/world-cup-command-center";
import { getDashboardSnapshot } from "@/lib/ops-data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const snapshot = await getDashboardSnapshot();

  return <WorldCupCommandCenter snapshot={snapshot} />;
}
