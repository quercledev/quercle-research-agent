"use client";

import { useState } from "react";
import { AgentStep, AgentPhase, StepType } from "@/lib/agent/types";
import {
  Brain,
  Search,
  Globe,
  Sparkles,
  AlertCircle,
  Database,
  BookOpen,
  Check,
  Loader2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface AgentTimelineProps {
  steps: AgentStep[];
  phase: AgentPhase;
}

const stepConfig: Record<StepType, {
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}> = {
  thinking: {
    icon: <Brain className="w-3.5 h-3.5" />,
    color: "text-slate-400",
    bgColor: "bg-slate-500/20",
  },
  search: {
    icon: <Search className="w-3.5 h-3.5" />,
    color: "text-primary",
    bgColor: "bg-primary/20",
  },
  fetch: {
    icon: <Globe className="w-3.5 h-3.5" />,
    color: "text-accent",
    bgColor: "bg-accent/20",
  },
  recall: {
    icon: <BookOpen className="w-3.5 h-3.5" />,
    color: "text-amber-400",
    bgColor: "bg-amber-500/20",
  },
  remember: {
    icon: <Database className="w-3.5 h-3.5" />,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20",
  },
  synthesis: {
    icon: <Sparkles className="w-3.5 h-3.5" />,
    color: "text-primary",
    bgColor: "bg-gradient-to-r from-primary/20 to-accent/20",
  },
  error: {
    icon: <AlertCircle className="w-3.5 h-3.5" />,
    color: "text-error",
    bgColor: "bg-error/20",
  },
};

export function AgentTimeline({ steps, phase }: AgentTimelineProps) {
  if (steps.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Brain className="w-6 h-6 text-primary/50" />
          </div>
          <p className="text-sm text-muted">Agent steps will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/50">
        <h3 className="text-sm font-medium text-foreground">Agent Activity</h3>
        <p className="text-xs text-muted mt-0.5">{steps.length} steps</p>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto p-4 hide-scrollbar">
        <div className="space-y-1">
          {steps.map((step, index) => (
            <TimelineStep
              key={step.id}
              step={step}
              isLast={index === steps.length - 1}
              index={index}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function TimelineStep({
  step,
  isLast,
  index,
}: {
  step: AgentStep;
  isLast: boolean;
  index: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = stepConfig[step.type];
  const isRunning = step.status === "running";
  const isComplete = step.status === "complete";
  const isError = step.status === "error";
  const hasDetails = step.toolOutput || step.toolInput;

  return (
    <div
      className="flex gap-3 animate-slide-in-left"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* Node and line */}
      <div className="flex flex-col items-center">
        <div
          className={`
            relative w-8 h-8 rounded-full flex items-center justify-center shrink-0
            ${config.bgColor} ${config.color}
            ${isRunning ? "pulse-ring" : ""}
            transition-all duration-300
          `}
        >
          {isRunning ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : isComplete ? (
            <Check className="w-3.5 h-3.5" />
          ) : isError ? (
            <AlertCircle className="w-3.5 h-3.5" />
          ) : (
            config.icon
          )}
        </div>
        {!isLast && (
          <div className="w-px flex-1 min-h-[16px] neural-line" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-4 min-w-0">
        <button
          onClick={() => hasDetails && setIsExpanded(!isExpanded)}
          className={`w-full text-left ${hasDetails ? "cursor-pointer hover:bg-white/5 rounded-lg -ml-2 pl-2 pr-2 py-1 transition-colors" : "cursor-default"}`}
          disabled={!hasDetails}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              {hasDetails && (
                isExpanded ? (
                  <ChevronDown className="w-3 h-3 text-muted shrink-0" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-muted shrink-0" />
                )
              )}
              <h4 className="text-sm font-medium text-foreground truncate">
                {step.title}
              </h4>
            </div>
            {step.duration && (
              <span className="text-xs text-muted shrink-0">
                {formatStepDuration(step.duration)}
              </span>
            )}
          </div>
          {step.description && (
            <p className={`text-xs text-muted mt-0.5 ${hasDetails ? "ml-[18px]" : ""} ${isExpanded ? "" : "line-clamp-2"}`}>
              {step.description}
            </p>
          )}
        </button>

        {/* Expanded details */}
        {isExpanded && hasDetails && (
          <div className="mt-2 ml-[18px] space-y-2">
            {step.toolInput != null && (
              <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                <p className="text-xs font-medium text-muted mb-1">Input</p>
                <pre className="text-xs text-foreground/80 whitespace-pre-wrap break-all overflow-hidden">
                  {formatToolData(step.toolInput)}
                </pre>
              </div>
            )}
            {step.toolOutput != null && (
              <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                <p className="text-xs font-medium text-muted mb-1">Output</p>
                <pre className="text-xs text-foreground/80 whitespace-pre-wrap break-all overflow-hidden max-h-48 overflow-y-auto">
                  {formatToolData(step.toolOutput)}
                </pre>
              </div>
            )}
          </div>
        )}

        {step.error && (
          <p className="text-xs text-error mt-1 bg-error/10 px-2 py-1 rounded">
            {step.error}
          </p>
        )}
      </div>
    </div>
  );
}

function formatToolData(data: unknown): string {
  if (typeof data === "string") return data;
  if (typeof data === "object" && data !== null) {
    // Check if it has a result property (common Quercle response format)
    if ("result" in data && typeof (data as Record<string, unknown>).result === "string") {
      return (data as Record<string, unknown>).result as string;
    }
    return JSON.stringify(data, null, 2);
  }
  return String(data);
}

function formatStepDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}
