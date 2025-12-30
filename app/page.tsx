"use client";

import { useState } from "react";
import { useResearchAgent } from "@/lib/hooks/useResearchAgent";
import { ResearchInput } from "@/components/ResearchInput";
import { ResearchView } from "@/components/ResearchView";
import { HistorySidebar } from "@/components/HistorySidebar";
import { Logo } from "@/components/Logo";
import { Github, History } from "lucide-react";

export default function Home() {
  const {
    state,
    startResearch,
    cancelResearch,
    resetResearch,
    loadResearch,
    isRunning,
    currentResearchId,
  } = useResearchAgent();

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const isActive = state.phase !== "idle" || state.steps.length > 0;

  return (
    <div className="min-h-screen bg-mesh relative overflow-hidden">
      {/* Floating orbs */}
      <div className="orb orb-1 -top-40 -left-40" />
      <div className="orb orb-2 top-1/3 -right-20" />
      <div className="orb orb-3 -bottom-20 left-1/4" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-muted hover:text-foreground hover:bg-white/5 rounded-lg transition-all"
              title="Research History"
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
            </button>
            <Logo />
          </div>
          <a
            href="https://github.com/quercledev/quercle-research-agent"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
          >
            <Github className="w-4 h-4" />
            <span className="hidden sm:inline">View on GitHub</span>
          </a>
        </header>

        {/* History Sidebar */}
        <HistorySidebar
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          onSelect={(id) => {
            loadResearch(id);
            setIsHistoryOpen(false);
          }}
          currentResearchId={currentResearchId}
        />

        {/* Main content */}
        <main className="flex-1 flex flex-col">
          {!isActive ? (
            // Centered input when idle
            <div className="flex-1 flex flex-col items-center justify-center px-4 pb-20">
              <div className="text-center mb-8 animate-fade-in-up">
                <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                  <span className="gradient-text">Deep Research</span>
                  <br />
                  <span className="text-foreground/80">with AI Agents</span>
                </h1>
                <p className="text-muted text-lg max-w-lg mx-auto">
                  Ask any complex question. Our AI agent will search, analyze, and synthesize information from across the web.
                </p>
              </div>
              <div className="w-full max-w-2xl animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <ResearchInput
                  onSubmit={startResearch}
                  isLoading={isRunning}
                  onCancel={cancelResearch}
                />
              </div>
            </div>
          ) : (
            // Split view when active
            <ResearchView
              state={state}
              isRunning={isRunning}
              onCancel={cancelResearch}
              onReset={resetResearch}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="p-4 text-center text-sm text-muted">
          <p>
            Powered by{" "}
            <a
              href="https://quercle.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary-hover transition-colors"
            >
              Quercle API
            </a>
            {" "}+{" "}
            <a
              href="https://mongodb.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary-hover transition-colors"
            >
              MongoDB
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
