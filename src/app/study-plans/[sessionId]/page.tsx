import type { Metadata } from "next";
import PlanPage from "@/app/plan/[sessionId]/page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My study plan",
  description:
    "A personalised MSCE revision timetable built from your quiz results, showing exactly which topics to study each week.",
};

export default PlanPage;
