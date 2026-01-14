export type AgentPhase =
  | "idle"
  | "planning"
  | "researching"
  | "synthesizing"
  | "complete"
  | "error";

export type StepType =
  | "thinking"
  | "search"
  | "fetch"
  | "recall"
  | "remember"
  | "synthesis"
  | "error";

export type StepStatus = "pending" | "running" | "complete" | "error";

export interface AgentStep {
  id: string;
  type: StepType;
  title: string;
  description?: string;
  status: StepStatus;
  toolInput?: Record<string, unknown>;
  toolOutput?: unknown;
  timestamp: Date;
  duration?: number;
  error?: string;
  stepNumber?: number;
}

export interface AgentState {
  phase: AgentPhase;
  question: string;
  steps: AgentStep[];
  report: string | null;
  error: string | null;
  startTime: Date | null;
  endTime: Date | null;
  model: string | null;
}

export function createInitialState(): AgentState {
  return {
    phase: "idle",
    question: "",
    steps: [],
    report: null,
    error: null,
    startTime: null,
    endTime: null,
    model: null,
  };
}
