"use client";

import React from "react";
import { StudioProvider, useStudio } from "@/lib/studio/store";
import type { StudioSectionId } from "@/lib/studio/types";
import { AppShell } from "./AppShell";
import { OverviewScreen } from "./screens/OverviewScreen";
import { InterviewScreen } from "./screens/InterviewScreen";
import { DataEvidenceScreen } from "./screens/DataEvidenceScreen";
import { ProcessAssessmentScreen } from "./screens/ProcessAssessmentScreen";
import { BenchmarkScreen } from "./screens/BenchmarkScreen";
import { RootCauseScreen } from "./screens/RootCauseScreen";
import { OpportunitiesScreen } from "./screens/OpportunitiesScreen";
import { ValueRealizationScreen } from "./screens/ValueRealizationScreen";
import { RoadmapScreen } from "./screens/RoadmapScreen";
import { ReportStudioScreen } from "./screens/ReportStudioScreen";

function ActiveScreenRouter() {
  const { activeSection } = useStudio();

  switch (activeSection) {
    case "overview":
      return <OverviewScreen />;
    case "interview":
      return <InterviewScreen />;
    case "data":
      return <DataEvidenceScreen />;
    case "process":
      return <ProcessAssessmentScreen />;
    case "benchmarks":
      return <BenchmarkScreen />;
    case "root-causes":
      return <RootCauseScreen />;
    case "opportunities":
      return <OpportunitiesScreen />;
    case "value":
      return <ValueRealizationScreen />;
    case "roadmap":
      return <RoadmapScreen />;
    case "report":
      return <ReportStudioScreen />;
    default:
      return <OverviewScreen />;
  }
}

export function StudioWorkspace({
  initialSection = "overview",
  initialClientName,
}: {
  initialSection?: StudioSectionId;
  initialClientName?: string;
}) {
  return (
    <StudioProvider
      initialSection={initialSection}
      initialClientName={initialClientName}
    >
      <AppShell>
        <ActiveScreenRouter />
      </AppShell>
    </StudioProvider>
  );
}
