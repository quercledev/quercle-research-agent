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

export interface Source {
  id: string;
  url: string;
  title?: string;
  snippet?: string;
  fetchedContent?: string;
  citationIndex?: number;
}

export interface AgentStep {
  id: string;
  type: StepType;
  title: string;
  description?: string;
  status: StepStatus;
  result?: string;
  toolInput?: Record<string, unknown>;
  toolOutput?: unknown;
  sources?: Source[];
  timestamp: Date;
  duration?: number;
  error?: string;
  stepNumber?: number; // For grouping parallel tool calls
}

export interface AgentState {
  phase: AgentPhase;
  question: string;
  subQuestions: string[];
  steps: AgentStep[];
  sources: Source[];
  currentStepIndex: number;
  report: string | null;
  error: string | null;
  startTime: Date | null;
  endTime: Date | null;
}

export function createInitialState(): AgentState {
  return {
    phase: "idle",
    question: "",
    subQuestions: [],
    steps: [],
    sources: [],
    currentStepIndex: -1,
    report: null,
    error: null,
    startTime: null,
    endTime: null,
  };
}
