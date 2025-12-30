"use client";

import { AgentState } from "@/lib/agent/types";
import { AgentTimeline } from "./AgentTimeline";
import { ReportPanel } from "./ReportPanel";
import { RotateCcw, X } from "lucide-react";

interface ResearchViewProps {
  state: AgentState;
  isRunning: boolean;
  onCancel: () => void;
  onReset: () => void;
}

export function ResearchView({
  state,
  isRunning,
  onCancel,
  onReset,
}: ResearchViewProps) {
  return (
    <div className="flex-1 flex flex-col px-4 sm:px-6 pb-4 animate-scale-in">
      {/* Header with question */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-semibold text-foreground truncate">
            {state.question}
          </h2>
          <div className="flex items-center gap-3 mt-1">
            <StatusBadge phase={state.phase} />
            {state.startTime && (
              <span className="text-xs text-muted">
                {formatDuration(state.startTime, state.endTime)}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isRunning ? (
            <button
              onClick={onCancel}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted hover:text-error glass rounded-lg transition-all hover:border-error/30"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </button>
          ) : (
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted hover:text-foreground glass rounded-lg transition-all hover:border-border-bright"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              New Research
            </button>
          )}
        </div>
      </div>

      {/* Main content grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
        {/* Timeline - narrower on desktop */}
        <div className="lg:col-span-4 xl:col-span-3 min-h-[300px] lg:min-h-0">
          <div className="glass-bright rounded-2xl h-full overflow-hidden">
            <AgentTimeline
              steps={state.steps}
              phase={state.phase}
            />
          </div>
        </div>

        {/* Report - wider on desktop */}
        <div className="lg:col-span-8 xl:col-span-9 min-h-[400px] lg:min-h-0">
          <div className="glass-bright rounded-2xl h-full overflow-hidden">
            <ReportPanel
              report={state.report}
              isLoading={isRunning}
              phase={state.phase}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ phase }: { phase: AgentState["phase"] }) {
  const config: Record<string, { label: string; color: string }> = {
    idle: { label: "Idle", color: "text-muted" },
    planning: { label: "Planning", color: "text-accent" },
    researching: { label: "Researching", color: "text-primary" },
    synthesizing: { label: "Synthesizing", color: "text-accent" },
    complete: { label: "Complete", color: "text-success" },
    error: { label: "Error", color: "text-error" },
  };

  const { label, color } = config[phase] || config.idle;

  return (
    <span className={`text-xs font-medium ${color} flex items-center gap-1.5`}>
      {phase === "researching" || phase === "synthesizing" ? (
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${phase === "researching" ? "bg-primary" : "bg-accent"}`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${phase === "researching" ? "bg-primary" : "bg-accent"}`} />
        </span>
      ) : phase === "complete" ? (
        <span className="h-2 w-2 rounded-full bg-success" />
      ) : phase === "error" ? (
        <span className="h-2 w-2 rounded-full bg-error" />
      ) : null}
      {label}
    </span>
  );
}

function formatDuration(start: Date, end: Date | null): string {
  const endTime = end || new Date();
  const elapsed = Math.floor((endTime.getTime() - start.getTime()) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}
