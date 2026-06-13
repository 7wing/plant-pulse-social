import PlantsHub from "@/components/PlantsHub";
import CareDashboard from "@/components/CareDashboard";

export default function MyPlantsPage() {
  return <PlantsHub journalTab={<CareDashboard />} />;
}
