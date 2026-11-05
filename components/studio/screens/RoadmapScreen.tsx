"use client";

import React, { useState, useMemo } from "react";
import {
  CalendarRange,
  Plus,
  CheckSquare,
  Square,
  Trash2,
  User,
  AlertCircle,
  GripVertical,
} from "lucide-react";
import { useStudio } from "@/lib/studio/store";
import type { RoadmapInitiative, RoadmapWave } from "@/lib/studio/types";

const WAVES: RoadmapWave[] = [
  "Wave 1 — Stabilize & Standardize",
  "Wave 2 — Automate & Optimize",
  "Wave 3 — Intelligent Finance",
];

const TIMELINE_MONTHS = [
  { key: "2026-11", label: "Nov '26" },
  { key: "2026-12", label: "Dec '26" },
  { key: "2027-01", label: "Jan '27" },
  { key: "2027-02", label: "Feb '27" },
  { key: "2027-03", label: "Mar '27" },
  { key: "2027-04", label: "Apr '27" },
  { key: "2027-05", label: "May '27" },
  { key: "2027-06", label: "Jun '27" },
  { key: "2027-07", label: "Jul '27" },
  { key: "2027-08", label: "Aug '27" },
];

export function RoadmapScreen() {
  const {
    roadmapInitiatives,
    addRoadmapInitiative,
    updateRoadmapInitiative,
    moveInitiativeWave,
    toggleInitiativeMilestone,
    deleteRoadmapInitiative,
  } = useStudio();

  const [selectedInitId, setSelectedInitId] = useState<string>(
    roadmapInitiatives[0]?.id ?? "init_01",
  );
  const [viewMode, setViewMode] = useState<"gantt" | "board">("gantt");
  const [draggedInitId, setDraggedInitId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("");

  // New Initiative form state
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newWave, setNewWave] = useState<RoadmapWave>(
    "Wave 1 — Stabilize & Standardize",
  );
  const [newOwner, setNewOwner] = useState("AP Manager");
  const [newValue, setNewValue] = useState(85000);
  const [newCost, setNewCost] = useState(35000);
  const [newWeeks, setNewWeeks] = useState(6);
  const [newStart, setNewStart] = useState("2026-12");
  const [newEnd, setNewEnd] = useState("2027-02");

  const activeInit =
    roadmapInitiatives.find((i) => i.id === selectedInitId) ??
    roadmapInitiatives[0];

  const summary = useMemo(() => {
    const totalValue = roadmapInitiatives.reduce(
      (s, i) => s + i.businessValueUsd,
      0,
    );
    const totalCost = roadmapInitiatives.reduce(
      (s, i) => s + i.implementationCostUsd,
      0,
    );
    const totalWeeks = roadmapInitiatives.reduce((s, i) => s + i.effortWeeks, 0);
    const quickWins = roadmapInitiatives.filter(
      (i) => i.wave === "Wave 1 — Stabilize & Standardize",
    ).length;
    const strategic = roadmapInitiatives.filter(
      (i) => i.wave !== "Wave 1 — Stabilize & Standardize",
    ).length;
    return {
      totalCount: roadmapInitiatives.length,
      totalValue,
      totalCost,
      totalWeeks,
      quickWins,
      strategic,
    };
  }, [roadmapInitiatives]);

  const handleAddInitiative = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    addRoadmapInitiative({
      name: newName.trim(),
      description:
        newDesc.trim() || "Process standardization and workflow automation.",
      processArea: "AP Operations",
      wave: newWave,
      businessValueUsd: newValue,
      implementationCostUsd: newCost,
      effortWeeks: newWeeks,
      dependencies: ["Stakeholder sign-off"],
      owner: newOwner,
      startDate: newStart,
      endDate: newEnd,
      status: "Planned",
      priority: "High",
      milestones: [
        {
          id: `ms_${Date.now()}`,
          title: "Design sign-off & configuration complete",
          dueMonth: newEnd,
          completed: false,
        },
      ],
      successKpi: "Cycle time & exception reduction target met",
    });
    setNewName("");
    setNewDesc("");
    setShowAddModal(false);
  };

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInit || !newMilestoneTitle.trim()) return;
    updateRoadmapInitiative(activeInit.id, {
      milestones: [
        ...activeInit.milestones,
        {
          id: `ms_${Date.now()}`,
          title: newMilestoneTitle.trim(),
          dueMonth: activeInit.endDate,
          completed: false,
        },
      ],
    });
    setNewMilestoneTitle("");
  };

  return (
    <div className="space-y-6">
      {/* 1. ROADMAP EXECUTIVE SUMMARY STRIP */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-3">
            {/* View Switcher */}
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setViewMode("gantt")}
                className={`rounded-md px-3 py-1 text-xs font-bold transition-colors ${
                  viewMode === "gantt"
                    ? "bg-[#0D1B2E] text-[#FFE600] shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                10-Month Gantt Timeline
              </button>
              <button
                type="button"
                onClick={() => setViewMode("board")}
                className={`rounded-md px-3 py-1 text-xs font-bold transition-colors ${
                  viewMode === "board"
                    ? "bg-[#0D1B2E] text-[#FFE600] shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                3-Wave Kanban Board
              </button>
            </div>
            <span className="hidden rounded bg-amber-50 border border-amber-200 px-2.5 py-1 text-[11px] font-semibold text-amber-900 xl:inline-block">
              Sequencing Enforced: Upstream PO &amp; Approval fixes precede Supplier Portal
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#FFE600] px-3.5 py-2 text-xs font-extrabold text-slate-950 hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Initiative</span>
          </button>
        </div>

        {/* 6 Roadmap KPI Summary Boxes */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 tabular-nums">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase">
              Total Initiatives
            </p>
            <p className="mt-1 text-lg font-extrabold text-slate-900">
              {summary.totalCount} active
            </p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
            <p className="text-[10px] font-bold text-emerald-800 uppercase">
              Estimated Benefits
            </p>
            <p className="mt-1 text-lg font-extrabold text-emerald-950">
              ${summary.totalValue.toLocaleString()}/yr
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase">
              Implementation Cost
            </p>
            <p className="mt-1 text-lg font-extrabold text-slate-900">
              ${summary.totalCost.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase">
              Cumulative Effort
            </p>
            <p className="mt-1 text-lg font-extrabold text-slate-900">
              {summary.totalWeeks} work-weeks
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase">
              Wave 1 Quick Wins
            </p>
            <p className="mt-1 text-lg font-extrabold text-slate-900">
              {summary.quickWins} initiatives
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase">
              Wave 2 &amp; 3 Strategic
            </p>
            <p className="mt-1 text-lg font-extrabold text-slate-900">
              {summary.strategic} initiatives
            </p>
          </div>
        </div>

        {/* Add Initiative Form */}
        {showAddModal && (
          <form
            onSubmit={handleAddInitiative}
            className="mt-4 rounded-xl border border-slate-300 bg-slate-50 p-4 space-y-3"
          >
            <h3 className="text-xs font-bold tracking-wider text-slate-900 uppercase">
              Add New Transformation Initiative
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700">
                  Initiative Name
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., Mobile Barcode GRN Scanning at Plant Docks"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Target Wave
                </label>
                <select
                  value={newWave}
                  onChange={(e) => setNewWave(e.target.value as RoadmapWave)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold"
                >
                  {WAVES.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Initiative Owner
                </label>
                <input
                  type="text"
                  value={newOwner}
                  onChange={(e) => setNewOwner(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Annual Value ($/yr)
                </label>
                <input
                  type="number"
                  value={newValue}
                  onChange={(e) => setNewValue(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Est. Cost ($)
                </label>
                <input
                  type="number"
                  value={newCost}
                  onChange={(e) => setNewCost(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Effort (Weeks)
                </label>
                <input
                  type="number"
                  value={newWeeks}
                  onChange={(e) => setNewWeeks(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Start Month
                </label>
                <select
                  value={newStart}
                  onChange={(e) => setNewStart(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs"
                >
                  {TIMELINE_MONTHS.map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-700">
                    End Month
                  </label>
                  <select
                    value={newEnd}
                    onChange={(e) => setNewEnd(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs"
                  >
                    {TIMELINE_MONTHS.map((m) => (
                      <option key={m.key} value={m.key}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white"
                >
                  Add
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* 2. UNIFIED WORKSPACE: GANTT OR WAVE BOARD (7 cols) + INITIATIVE INSPECTOR (5 cols) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Active View (Gantt Timeline OR 3-Wave Kanban Board) (7 cols) */}
        <div className="lg:col-span-7">
          {viewMode === "gantt" ? (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                  <CalendarRange className="h-4 w-4 text-slate-800" />
                  <span>10-Month Transformation Gantt Schedule</span>
                </h3>
                <span className="text-[11px] text-slate-500">
                  Select any row to inspect &amp; edit on the right
                </span>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[10px] text-slate-600 uppercase">
                      <th className="w-56 px-3 py-2.5 font-bold">Initiative &amp; Wave</th>
                      {TIMELINE_MONTHS.map((m) => (
                        <th
                          key={m.key}
                          className="border-l border-slate-200 px-1.5 py-2.5 text-center font-mono font-bold"
                        >
                          {m.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {roadmapInitiatives.map((init) => {
                      const startIdx = Math.max(
                        0,
                        TIMELINE_MONTHS.findIndex((m) => m.key === init.startDate),
                      );
                      const endIdx = Math.max(
                        startIdx,
                        TIMELINE_MONTHS.findIndex((m) => m.key === init.endDate),
                      );
                      const isSelected = activeInit?.id === init.id;

                      return (
                        <tr
                          key={init.id}
                          onClick={() => setSelectedInitId(init.id)}
                          className={`cursor-pointer ${
                            isSelected ? "bg-amber-50/70" : "hover:bg-slate-50"
                          }`}
                        >
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-1.5">
                              <span className="rounded bg-[#0D1B2E] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#FFE600]">
                                {init.code}
                              </span>
                              <span className="max-w-[175px] truncate font-bold text-slate-900">
                                {init.name}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500">
                              {init.wave} · {init.owner}
                            </span>
                          </td>
                          {TIMELINE_MONTHS.map((m, idx) => {
                            const activeMonth = idx >= startIdx && idx <= endIdx;
                            const barColor = init.wave.startsWith("Wave 1")
                              ? "bg-[#0D1B2E] text-[#FFE600]"
                              : init.wave.startsWith("Wave 2")
                                ? "bg-[#0F8B8D] text-white"
                                : "bg-amber-400 text-slate-950";

                            return (
                              <td
                                key={m.key}
                                className="border-l border-slate-100 px-1 py-2 text-center"
                              >
                                {activeMonth && (
                                  <div
                                    className={`h-5 w-full rounded-xs text-[10px] font-bold leading-5 ${barColor}`}
                                  >
                                    {idx === startIdx ? `${init.effortWeeks}w` : ""}
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {WAVES.map((wave) => {
                const waveInits = roadmapInitiatives.filter((i) => i.wave === wave);
                const waveVal = waveInits.reduce(
                  (s, i) => s + i.businessValueUsd,
                  0,
                );

                return (
                  <div
                    key={wave}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (draggedInitId) {
                        moveInitiativeWave(draggedInitId, wave);
                        setDraggedInitId(null);
                      }
                    }}
                    className="flex flex-col rounded-xl border border-slate-200 bg-slate-100/70 p-3.5"
                  >
                    <div className="mb-3 border-b border-slate-200 pb-2.5">
                      <span className="text-xs font-extrabold text-slate-900">
                        {wave}
                      </span>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-600">
                        <span>{waveInits.length} initiatives</span>
                        <span className="font-mono font-bold text-emerald-800">
                          +${(waveVal / 1000).toFixed(0)}k/yr
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 space-y-2.5">
                      {waveInits.map((init) => {
                        const isSelected = activeInit?.id === init.id;
                        const doneMs = init.milestones.filter(
                          (m) => m.completed,
                        ).length;

                        return (
                          <div
                            key={init.id}
                            draggable
                            onDragStart={() => setDraggedInitId(init.id)}
                            onClick={() => setSelectedInitId(init.id)}
                            className={`cursor-grab rounded-lg border bg-white p-3 shadow-xs transition-all active:cursor-grabbing ${
                              isSelected
                                ? "border-slate-900 ring-2 ring-[#FFE600]"
                                : "border-slate-200 hover:border-slate-400"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-slate-700">
                                <GripVertical className="h-3 w-3 text-slate-400" />
                                {init.code}
                              </span>
                              <span
                                className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                  init.status === "In Progress"
                                    ? "bg-amber-100 text-amber-800"
                                    : init.status === "Completed"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {init.status}
                              </span>
                            </div>
                            <p className="mt-1.5 text-xs font-bold text-slate-900 leading-snug">
                              {init.name}
                            </p>
                            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                              <span className="font-mono font-bold text-emerald-700">
                                +${(init.businessValueUsd / 1000).toFixed(0)}k/yr
                              </span>
                              <span>
                                Milestones: {doneMs}/{init.milestones.length}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Selected Initiative Editor & Milestones (5 cols) */}
        {activeInit && (
          <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-5 space-y-4">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <span className="rounded bg-[#0D1B2E] px-2 py-0.5 font-mono text-xs font-bold text-[#FFE600]">
                    {activeInit.code}
                  </span>
                  <h3 className="mt-1.5 text-base font-extrabold text-slate-900">
                    {activeInit.name}
                  </h3>
                </div>
                {roadmapInitiatives.length > 1 && (
                  <button
                    type="button"
                    onClick={() => deleteRoadmapInitiative(activeInit.id)}
                    className="rounded border border-red-200 bg-red-50 p-1.5 text-red-600 hover:bg-red-100"
                    title="Delete initiative"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600">
                    Assigned Wave
                  </label>
                  <select
                    value={activeInit.wave}
                    onChange={(e) =>
                      moveInitiativeWave(
                        activeInit.id,
                        e.target.value as RoadmapWave,
                      )
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900"
                  >
                    {WAVES.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600">
                    Execution Status
                  </label>
                  <select
                    value={activeInit.status}
                    onChange={(e) =>
                      updateRoadmapInitiative(activeInit.id, {
                        status: e.target.value as RoadmapInitiative["status"],
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900"
                  >
                    <option value="Planned">Planned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="At Risk">At Risk</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600">
                    Start Month
                  </label>
                  <select
                    value={activeInit.startDate}
                    onChange={(e) =>
                      updateRoadmapInitiative(activeInit.id, {
                        startDate: e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900"
                  >
                    {TIMELINE_MONTHS.map((m) => (
                      <option key={m.key} value={m.key}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600">
                    End Month
                  </label>
                  <select
                    value={activeInit.endDate}
                    onChange={(e) =>
                      updateRoadmapInitiative(activeInit.id, {
                        endDate: e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900"
                  >
                    {TIMELINE_MONTHS.map((m) => (
                      <option key={m.key} value={m.key}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600">
                    Initiative Owner
                  </label>
                  <div className="relative mt-1 flex items-center">
                    <User className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={activeInit.owner}
                      onChange={(e) =>
                        updateRoadmapInitiative(activeInit.id, {
                          owner: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pr-2.5 pl-8 text-xs font-semibold text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600">
                    Priority
                  </label>
                  <select
                    value={activeInit.priority}
                    onChange={(e) =>
                      updateRoadmapInitiative(activeInit.id, {
                        priority: e.target.value as RoadmapInitiative["priority"],
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                  </select>
                </div>
              </div>

              {/* Milestones Checklist */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
                <h4 className="text-xs font-bold tracking-wider text-slate-700 uppercase">
                  Implementation Milestones ({activeInit.milestones.length})
                </h4>
                <div className="mt-2 space-y-1.5">
                  {activeInit.milestones.map((ms) => (
                    <button
                      key={ms.id}
                      type="button"
                      onClick={() =>
                        toggleInitiativeMilestone(activeInit.id, ms.id)
                      }
                      className="flex w-full items-center justify-between rounded border border-slate-200 bg-white px-3 py-2 text-left text-xs hover:border-slate-400"
                    >
                      <span
                        className={`flex items-center gap-2 ${
                          ms.completed
                            ? "line-through text-slate-400"
                            : "font-semibold text-slate-800"
                        }`}
                      >
                        {ms.completed ? (
                          <CheckSquare className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Square className="h-4 w-4 text-slate-400" />
                        )}
                        {ms.title}
                      </span>
                      <span className="font-mono text-[10px] text-slate-500">
                        {ms.dueMonth}
                      </span>
                    </button>
                  ))}
                </div>

                <form onSubmit={handleAddMilestone} className="mt-2.5 flex gap-2">
                  <input
                    type="text"
                    value={newMilestoneTitle}
                    onChange={(e) => setNewMilestoneTitle(e.target.value)}
                    placeholder="Add a key delivery milestone…"
                    className="flex-1 rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                  />
                  <button
                    type="submit"
                    className="rounded bg-slate-900 px-3 py-1.5 text-xs font-bold text-white"
                  >
                    + Add
                  </button>
                </form>
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-xs">
                <p className="flex items-center gap-1.5 font-bold text-amber-900">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>Dependencies &amp; Success Metric</span>
                </p>
                <p className="mt-1 text-slate-700">
                  <strong>Depends on:</strong> {activeInit.dependencies.join(", ")}
                </p>
                <p className="mt-0.5 text-emerald-900 font-semibold">
                  <strong>Target KPI:</strong> {activeInit.successKpi}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
