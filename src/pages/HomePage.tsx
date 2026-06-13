import PlantsHub from "@/components/PlantsHub";
import PlantsJournalTab from "@/components/PlantsJournalTab";

export default function HomePage() {
  return <PlantsHub journalTab={<PlantsJournalTab />} />;
}
