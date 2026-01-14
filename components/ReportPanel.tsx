"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check, FileText, Code, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AgentPhase } from "@/lib/agent/types";

interface ReportPanelProps {
  report: string | null;
  isLoading: boolean;
  phase: AgentPhase;
}

export function ReportPanel({ report, isLoading, phase }: ReportPanelProps) {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"rendered" | "raw">("rendered");

  const handleCopy = async () => {
    if (!report) return;
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  // Empty state
  if (!report && !isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-primary/50" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            Research Report
          </h3>
          <p className="text-sm text-muted max-w-sm">
            Your comprehensive research report will appear here once the agent completes its analysis.
          </p>
        </div>
      </div>
    );
  }

  // Loading state (before any content)
  if (isLoading && !report) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            {/* Animated gradient ring */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary to-accent opacity-30 animate-pulse" />
            <div className="relative w-full h-full rounded-2xl bg-card-solid flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary animate-pulse" />
            </div>
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            {phase === "researching" ? "Researching..." : "Synthesizing..."}
          </h3>
          <p className="text-sm text-muted">
            {phase === "researching"
              ? "Gathering information from multiple sources"
              : "Creating your comprehensive report"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode("rendered")}
            className={`px-2.5 py-1.5 text-xs rounded-lg flex items-center gap-1.5 transition-all ${
              viewMode === "rendered"
                ? "bg-primary/20 text-primary"
                : "text-muted hover:text-foreground"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Rendered
          </button>
          <button
            onClick={() => setViewMode("raw")}
            className={`px-2.5 py-1.5 text-xs rounded-lg flex items-center gap-1.5 transition-all ${
              viewMode === "raw"
                ? "bg-primary/20 text-primary"
                : "text-muted hover:text-foreground"
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            Source
          </button>
        </div>
        <button
          onClick={handleCopy}
          disabled={!report}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted hover:text-foreground transition-colors disabled:opacity-50"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-success" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              Copy
            </>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 min-h-0">
        {viewMode === "rendered" ? (
          <div className={`prose prose-sm max-w-none ${isLoading ? "typing-cursor" : ""}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {report || ""}
            </ReactMarkdown>
          </div>
        ) : (
          <pre className="text-sm text-muted-light font-mono whitespace-pre-wrap bg-card-solid p-4 rounded-xl border border-border">
            {report}
          </pre>
        )}
      </div>
    </div>
  );
}
