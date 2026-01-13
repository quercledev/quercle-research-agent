"use client";

import { useState, useEffect } from "react";
import { History, Trash2, ChevronRight, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface HistoryItem {
  id: string;
  question: string;
  status: "researching" | "synthesizing" | "complete" | "error";
  startedAt: string;
  duration: number | null;
  model: string | null;
}

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
  currentResearchId?: string | null;
}

export function HistorySidebar({ isOpen, onClose, onSelect, currentResearchId }: HistorySidebarProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/history?limit=50");
      const data = await response.json();
      setHistory(data.history || []);
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleting(id);
    try {
      await fetch(`/api/history/${id}`, { method: "DELETE" });
      setHistory((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Failed to delete:", error);
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return null;
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case "complete":
        return <CheckCircle className="w-4 h-4 text-success" />;
      case "error":
        return <XCircle className="w-4 h-4 text-error" />;
      default:
        return <Clock className="w-4 h-4 text-muted" />;
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed top-0 left-0 h-full w-80 bg-card-solid border-r border-border z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">Research History</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted hover:text-foreground rounded-lg hover:bg-white/5 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto h-[calc(100%-60px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <History className="w-12 h-12 text-muted/30 mb-3" />
              <p className="text-muted text-sm">No research history yet</p>
              <p className="text-muted/70 text-xs mt-1">
                Your completed researches will appear here
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {history.map((item) => (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect(item.id)}
                  onKeyDown={(e) => e.key === "Enter" && onSelect(item.id)}
                  className={`
                    w-full text-left p-3 rounded-xl transition-all group cursor-pointer
                    ${
                      currentResearchId === item.id
                        ? "bg-primary/20 border border-primary/30"
                        : "hover:bg-white/5 border border-transparent"
                    }
                  `}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground font-medium line-clamp-2">
                        {item.question}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <StatusIcon status={item.status} />
                        <span className="text-xs text-muted">
                          {formatDate(item.startedAt)}
                        </span>
                        {item.duration && (
                          <span className="text-xs text-muted/70">
                            {formatDuration(item.duration)}
                          </span>
                        )}
                        {item.model && (
                          <span className="text-xs text-muted/50 bg-white/5 px-1.5 py-0.5 rounded">
                            {item.model.split("/").pop()}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      disabled={deleting === item.id}
                      className="p-1.5 text-muted/50 hover:text-error opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-error/10"
                    >
                      {deleting === item.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
