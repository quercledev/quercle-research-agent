"use client";

import { useState, useCallback, useRef } from "react";
import { AgentState, AgentStep, StepType, createInitialState } from "../agent/types";

// Generate unique IDs
const generateId = () => Math.random().toString(36).slice(2, 11);

// Tool name to step type mapping
const toolToStepType: Record<string, StepType> = {
  quercleSearch: "search",
  quercleFetch: "fetch",
  recall: "recall",
  remember: "remember",
};

// Tool name to display name mapping
const toolDisplayNames: Record<string, string> = {
  quercleSearch: "Searching the web",
  quercleFetch: "Fetching page content",
  recall: "Checking memory",
  remember: "Saving to memory",
};

interface StreamEvent {
  type: string;
  toolCallId?: string;
  toolName?: string;
  args?: Record<string, unknown>;
  result?: unknown;
  delta?: string;
  textDelta?: string;
  error?: string;
  finishReason?: string;
}

export function useResearchAgent() {
  const [state, setState] = useState<AgentState>(createInitialState());
  const [isRunning, setIsRunning] = useState(false);
  const [currentResearchId, setCurrentResearchId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const activeToolCalls = useRef<Map<string, string>>(new Map());
  const startTimeRef = useRef<Date | null>(null);

  const startResearch = useCallback(async (question: string) => {
    if (!question.trim()) {
      setState((prev) => ({
        ...prev,
        phase: "error",
        error: "Please enter a research question",
      }));
      return;
    }

    // Reset state
    const startTime = new Date();
    startTimeRef.current = startTime;
    setCurrentResearchId(null);
    setState({
      ...createInitialState(),
      question,
      phase: "researching",
      startTime,
    });
    setIsRunning(true);
    activeToolCalls.current.clear();

    abortControllerRef.current = new AbortController();

    let fullText = "";
    let synthesisStepId: string | null = null;

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Research failed" }));
        throw new Error(errorData.error || "Research failed");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim()) continue;

            // Handle SSE data format
            let eventData = line;
            if (line.startsWith("data: ")) {
              eventData = line.slice(6);
            }

            // Skip done signal and comments
            if (eventData === "[DONE]" || eventData.startsWith(":")) continue;

            // Try to parse as JSON event
            try {
              const event: StreamEvent = JSON.parse(eventData);

              switch (event.type) {
                case "tool-call": {
                  // Initial tool call - may have empty args initially
                  const toolName = event.toolName || "unknown";
                  const stepId = generateId();
                  if (event.toolCallId) {
                    activeToolCalls.current.set(event.toolCallId, stepId);
                  }

                  const args = event.args || {};
                  const inputStr = getInputDescription(args);

                  setState((prev) => ({
                    ...prev,
                    steps: [
                      ...prev.steps,
                      {
                        id: stepId,
                        type: toolToStepType[toolName] || "thinking",
                        title: toolDisplayNames[toolName] || toolName,
                        description: inputStr || "Processing...",
                        status: "running",
                        timestamp: new Date(),
                        toolInput: args,
                      },
                    ],
                  }));
                  break;
                }

                case "tool-result": {
                  const stepId = event.toolCallId
                    ? activeToolCalls.current.get(event.toolCallId)
                    : null;

                  if (stepId) {
                    setState((prev) => ({
                      ...prev,
                      steps: prev.steps.map((s) =>
                        s.id === stepId
                          ? {
                              ...s,
                              status: "complete" as const,
                              duration: Date.now() - s.timestamp.getTime(),
                              toolOutput: event.result,
                            }
                          : s
                      ),
                    }));
                    if (event.toolCallId) {
                      activeToolCalls.current.delete(event.toolCallId);
                    }
                  }
                  break;
                }

                case "text-delta": {
                  const textChunk = event.delta || event.textDelta || "";
                  fullText += textChunk;

                  if (!synthesisStepId) {
                    synthesisStepId = generateId();
                    setState((prev) => ({
                      ...prev,
                      phase: "synthesizing",
                      report: fullText,
                      steps: [
                        ...prev.steps,
                        {
                          id: synthesisStepId!,
                          type: "synthesis",
                          title: "Writing response",
                          description: fullText.slice(0, 100) + (fullText.length > 100 ? "..." : ""),
                          status: "running",
                          timestamp: new Date(),
                        },
                      ],
                    }));
                  } else {
                    setState((prev) => ({
                      ...prev,
                      report: fullText,
                      steps: prev.steps.map((s) =>
                        s.id === synthesisStepId
                          ? {
                              ...s,
                              description: fullText.slice(0, 100) + (fullText.length > 100 ? "..." : ""),
                            }
                          : s
                      ),
                    }));
                  }
                  break;
                }

                case "finish": {
                  setState((prev) => ({
                    ...prev,
                    phase: "complete",
                    endTime: new Date(),
                    steps: synthesisStepId
                      ? prev.steps.map((s) =>
                          s.id === synthesisStepId
                            ? {
                                ...s,
                                status: "complete" as const,
                                duration: Date.now() - s.timestamp.getTime(),
                                description: "Response complete",
                              }
                            : s
                        )
                      : prev.steps,
                  }));
                  break;
                }

                case "error": {
                  throw new Error(event.error || "Stream error");
                }
              }
            } catch (parseError) {
              // If it's not JSON, it might be raw text or a parsing error
              // Only log actual parse errors, not intentional non-JSON lines
              if (eventData.startsWith("{")) {
                console.warn("[Stream] Failed to parse:", eventData.slice(0, 50));
              }
            }
          }
        }
      }

      // Ensure completion and save to history
      setState((prev) => {
        const finalState = {
          ...prev,
          phase: prev.phase === "error" ? "error" as const : "complete" as const,
          endTime: new Date(),
        };

        // Save to history (async, don't await)
        saveToHistory(finalState);

        return finalState;
      });
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        setState((prev) => ({
          ...prev,
          phase: "idle",
          endTime: new Date(),
        }));
      } else {
        setState((prev) => {
          const finalState = {
            ...prev,
            phase: "error" as const,
            error: error instanceof Error ? error.message : "Research failed",
            endTime: new Date(),
          };

          // Save error state to history
          saveToHistory(finalState);

          return finalState;
        });
      }
    } finally {
      setIsRunning(false);
    }

    // Helper to save research to history
    async function saveToHistory(finalState: AgentState) {
      if (!finalState.question || finalState.phase === "idle") return;

      try {
        const response = await fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: finalState.question,
            report: finalState.report,
            steps: finalState.steps.map((s) => ({
              id: s.id,
              type: s.type,
              title: s.title,
              description: s.description,
              status: s.status,
              toolInput: s.toolInput,
              toolOutput: s.toolOutput,
              duration: s.duration,
              timestamp: s.timestamp,
            })),
            status: finalState.phase,
            error: finalState.error,
            startedAt: startTimeRef.current?.toISOString(),
            completedAt: finalState.endTime?.toISOString(),
          }),
        });

        const data = await response.json();
        if (data.id) {
          setCurrentResearchId(data.id);
        }
      } catch (err) {
        console.error("Failed to save research to history:", err);
      }
    }
  }, []);

  const cancelResearch = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsRunning(false);
  }, []);

  const resetResearch = useCallback(() => {
    setState(createInitialState());
    activeToolCalls.current.clear();
    setCurrentResearchId(null);
    setIsRunning(false);
  }, []);

  const loadResearch = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/history/${id}`);
      if (!response.ok) {
        throw new Error("Failed to load research");
      }

      const { research } = await response.json();
      if (!research) {
        throw new Error("Research not found");
      }

      setCurrentResearchId(id);
      setState({
        phase: research.status,
        question: research.question,
        subQuestions: [],
        steps: research.steps.map((s: AgentStep) => ({
          ...s,
          timestamp: new Date(s.timestamp),
        })),
        sources: [],
        currentStepIndex: research.steps.length - 1,
        report: research.report,
        error: research.error || null,
        startTime: new Date(research.startedAt),
        endTime: research.completedAt ? new Date(research.completedAt) : null,
      });
    } catch (error) {
      console.error("Failed to load research:", error);
      setState((prev) => ({
        ...prev,
        phase: "error",
        error: error instanceof Error ? error.message : "Failed to load research",
      }));
    }
  }, []);

  return {
    state,
    startResearch,
    cancelResearch,
    resetResearch,
    loadResearch,
    isRunning,
    currentResearchId,
  };
}

// Helper to extract readable description from tool args
function getInputDescription(args: Record<string, unknown>): string {
  if (args.query) return String(args.query);
  if (args.url) return String(args.url);
  if (args.topic) return String(args.topic);

  const str = JSON.stringify(args);
  return str.length > 100 ? str.slice(0, 100) + "..." : str;
}
