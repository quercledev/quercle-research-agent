"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";

interface ResearchInputProps {
  onSubmit: (question: string) => void;
  isLoading: boolean;
  onCancel: () => void;
  compact?: boolean;
}

const EXAMPLE_QUESTIONS = [
  "What are the latest breakthroughs in quantum computing?",
  "How does CRISPR gene editing work and what are its applications?",
  "What are the environmental impacts of cryptocurrency mining?",
];

export function ResearchInput({
  onSubmit,
  isLoading,
  onCancel,
  compact = false,
}: ResearchInputProps) {
  const [question, setQuestion] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [question]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim() && !isLoading) {
      onSubmit(question.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a new question..."
          disabled={isLoading}
          className="w-full bg-card-solid border border-border rounded-xl px-4 py-3 pr-12 text-foreground placeholder:text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-glow transition-all"
        />
        <button
          type="submit"
          disabled={!question.trim() || isLoading}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ArrowRight className="w-4 h-4" />
          )}
        </button>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="relative">
        <div className="input-box overflow-hidden">
          <textarea
            ref={textareaRef}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What would you like to research?"
            disabled={isLoading}
            rows={1}
            className="w-full bg-transparent px-6 py-5 text-lg text-foreground placeholder:text-muted-light resize-none focus:outline-none min-h-[60px]"
          />
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-xs text-muted">
              Press Enter to submit • Shift+Enter for new line
            </span>
            <button
              type="submit"
              disabled={!question.trim() || isLoading}
              className="btn-primary px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="relative z-10">Researching...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">Start Research</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Example questions */}
      {!isLoading && !question && (
        <div className="space-y-3">
          <p className="text-sm text-muted text-center">Try an example:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {EXAMPLE_QUESTIONS.map((example, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setQuestion(example)}
                className="text-sm px-4 py-2.5 bg-card-solid border border-border rounded-xl text-muted-light hover:text-foreground hover:border-primary/50 hover:bg-card-hover transition-all"
              >
                {example.length > 45 ? example.slice(0, 45) + "..." : example}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
