"use client";

import { useState, useMemo } from "react";
import { AgentStep, StepType } from "@/lib/agent/types";
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

// Represents either a single step or a group of parallel steps
interface StepGroup {
  type: "single" | "parallel";
  steps: AgentStep[];
  stepNumber?: number;
}

interface AgentTimelineProps {
  steps: AgentStep[];
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

// Group steps by stepNumber for parallel execution display
function groupStepsByStepNumber(steps: AgentStep[]): StepGroup[] {
  const groups: StepGroup[] = [];
  let currentGroup: AgentStep[] = [];
  let currentStepNumber: number | undefined = undefined;

  for (const step of steps) {
    const stepNum = step.stepNumber;

    if (stepNum === undefined) {
      // Step without stepNumber - flush current group and add as single
      if (currentGroup.length > 0) {
        groups.push({
          type: currentGroup.length > 1 ? "parallel" : "single",
          steps: currentGroup,
          stepNumber: currentStepNumber,
        });
        currentGroup = [];
        currentStepNumber = undefined;
      }
      groups.push({ type: "single", steps: [step] });
    } else if (stepNum === currentStepNumber) {
      // Same step number - add to current group
      currentGroup.push(step);
    } else {
      // Different step number - flush current group and start new one
      if (currentGroup.length > 0) {
        groups.push({
          type: currentGroup.length > 1 ? "parallel" : "single",
          steps: currentGroup,
          stepNumber: currentStepNumber,
        });
      }
      currentGroup = [step];
      currentStepNumber = stepNum;
    }
  }

  // Flush remaining group
  if (currentGroup.length > 0) {
    groups.push({
      type: currentGroup.length > 1 ? "parallel" : "single",
      steps: currentGroup,
      stepNumber: currentStepNumber,
    });
  }

  return groups;
}

export function AgentTimeline({ steps }: AgentTimelineProps) {
  const stepGroups = useMemo(() => groupStepsByStepNumber(steps), [steps]);

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
    <div className="h-full flex flex-col min-h-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/50 shrink-0">
        <h3 className="text-sm font-medium text-foreground">Agent Activity</h3>
        <p className="text-xs text-muted mt-0.5">{steps.length} steps</p>
      </div>

      {/* Timeline - scrollable */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        <div className="space-y-1">
          {stepGroups.map((group, groupIndex) => (
            <StepGroup
              key={`group-${group.stepNumber}-${groupIndex}`}
              steps={group.steps}
              isLast={groupIndex === stepGroups.length - 1}
              groupIndex={groupIndex}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Step group - all items at same level with shared left border
function StepGroup({
  steps,
  isLast,
  groupIndex,
}: {
  steps: AgentStep[];
  isLast: boolean;
  groupIndex: number;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Get summary for collapsed view
  const getGroupSummary = () => {
    const types = steps.map(s => s.type);
    const thinkingCount = types.filter(t => t === "thinking").length;
    const searchCount = types.filter(t => t === "search").length;
    const fetchCount = types.filter(t => t === "fetch").length;
    const memoryCount = types.filter(t => t === "recall" || t === "remember").length;

    const parts: string[] = [];
    if (thinkingCount > 0) parts.push(`${thinkingCount} thinking`);
    if (searchCount > 0) parts.push(`${searchCount} search`);
    if (fetchCount > 0) parts.push(`${fetchCount} fetch`);
    if (memoryCount > 0) parts.push(`${memoryCount} memory`);
    return parts.join(", ") || `${steps.length} steps`;
  };

  if (!isExpanded) {
    // Collapsed view - single line summary
    return (
      <div className="flex gap-3 pb-2">
        <div className="flex flex-col items-center">
          <button
            onClick={() => setIsExpanded(true)}
            className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 hover:bg-primary/30 transition-colors text-xs font-medium"
          >
            +{steps.length}
          </button>
          {!isLast && <div className="w-px flex-1 min-h-[4px] bg-border/20" />}
        </div>
        <button
          onClick={() => setIsExpanded(true)}
          className="flex-1 text-left text-sm text-muted hover:text-foreground transition-colors py-1"
        >
          {getGroupSummary()}
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex gap-1">
      {/* Collapse button */}
      <button
        onClick={() => setIsExpanded(false)}
        className="w-5 h-5 mt-1.5 rounded bg-primary/20 text-primary flex items-center justify-center hover:bg-primary/40 transition-colors text-xs shrink-0"
        title="Collapse group"
      >
        −
      </button>
      {/* Group content with left border */}
      <div className={`flex-1 border-l-2 border-primary/30 pl-2 ${!isLast ? "pb-1" : ""}`}>
        {steps.map((step, idx) => (
          <GroupedStepItem
            key={step.id}
            step={step}
            isLast={isLast && idx === steps.length - 1}
            index={groupIndex + idx}
          />
        ))}
      </div>
    </div>
  );
}

function GroupedStepItem({
  step,
  isLast,
  index,
}: {
  step: AgentStep;
  isLast: boolean;
  index: number;
}) {
  const [isDetailExpanded, setIsDetailExpanded] = useState(false);
  const config = stepConfig[step.type];
  const isRunning = step.status === "running";
  const isComplete = step.status === "complete";
  const isError = step.status === "error";
  const thinkingContent = step.type === "thinking" && ((typeof step.toolOutput === "string" && step.toolOutput) || (step.description && step.description.length > 50));
  const hasExpandableContent = step.toolInput != null || (step.type !== "thinking" && step.toolOutput != null) || thinkingContent;

  return (
    <div
      className="flex gap-3"
      style={{ animationDelay: `${index * 0.03}s` }}
    >
      {/* Node and line */}
      <div className="flex flex-col items-center">
        <div
          className={`
            relative w-7 h-7 rounded-full flex items-center justify-center shrink-0
            ${config.bgColor} ${config.color}
            transition-all duration-200
          `}
        >
          {isRunning ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : isComplete ? (
            <Check className="w-3 h-3" />
          ) : isError ? (
            <AlertCircle className="w-3 h-3" />
          ) : (
            config.icon
          )}
        </div>
        {!isLast && (
          <div className="w-px flex-1 min-h-[4px] bg-border/20" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-2 min-w-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => hasExpandableContent && setIsDetailExpanded(!isDetailExpanded)}
            className={`flex-1 text-left ${hasExpandableContent ? "cursor-pointer hover:bg-white/5 rounded -ml-1 pl-1 pr-1 py-0.5 transition-colors" : "cursor-default"}`}
            disabled={!hasExpandableContent}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                {hasExpandableContent && (
                  isDetailExpanded ? (
                    <ChevronDown className="w-3 h-3 text-muted shrink-0" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-muted shrink-0" />
                  )
                )}
                <span className="text-sm font-medium text-foreground truncate">
                  {step.title}
                </span>
              </div>
              {step.duration && (
                <span className="text-xs text-muted shrink-0">
                  {formatStepDuration(step.duration)}
                </span>
              )}
            </div>
            {step.description && !(step.type === "thinking" && isDetailExpanded) && (
              <p className={`text-xs text-muted mt-0.5 ${hasExpandableContent ? "ml-4" : ""} line-clamp-1`}>
                {step.description}
              </p>
            )}
          </button>

        </div>

        {/* Expanded details */}
        {isDetailExpanded && hasExpandableContent && (
          <div className="mt-1.5 ml-4 space-y-2">
            {/* For thinking steps, show full content (toolOutput for old history, description for new) */}
            {step.type === "thinking" ? (
              <div className="bg-white/5 rounded p-2 border border-white/10">
                <pre className="text-xs text-foreground/80 whitespace-pre-wrap break-all overflow-hidden max-h-40 overflow-y-auto">
                  {(typeof step.toolOutput === "string" ? step.toolOutput : null) || step.description}
                </pre>
              </div>
            ) : (
              <>
                {step.toolInput != null && (
                  <div className="bg-white/5 rounded p-2 border border-white/10">
                    <p className="text-xs font-medium text-muted mb-1">Input</p>
                    <pre className="text-xs text-foreground/80 whitespace-pre-wrap break-all overflow-hidden max-h-32 overflow-y-auto">
                      {formatToolData(step.toolInput)}
                    </pre>
                  </div>
                )}
                {step.toolOutput != null && (
                  <div className="bg-white/5 rounded p-2 border border-white/10">
                    <p className="text-xs font-medium text-muted mb-1">Output</p>
                    <pre className="text-xs text-foreground/80 whitespace-pre-wrap break-all overflow-hidden max-h-40 overflow-y-auto">
                      {formatToolData(step.toolOutput)}
                    </pre>
                  </div>
                )}
              </>
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
