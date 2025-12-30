"use client";

export function Logo() {
  return (
    <a href="/" className="flex items-center gap-3 group">
      {/* Custom logo icon */}
      <div className="relative w-10 h-10">
        {/* Outer glow */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary to-accent opacity-50 blur-md group-hover:opacity-70 transition-opacity" />
        {/* Main icon */}
        <div className="relative w-full h-full rounded-xl bg-gradient-to-br from-primary to-accent p-[1px]">
          <div className="w-full h-full rounded-xl bg-background/90 flex items-center justify-center">
            {/* Neural network icon */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              className="text-primary"
            >
              {/* Center node */}
              <circle cx="12" cy="12" r="2.5" fill="currentColor" />
              {/* Outer nodes */}
              <circle cx="12" cy="4" r="2" fill="currentColor" opacity="0.7" />
              <circle cx="19" cy="8" r="2" fill="currentColor" opacity="0.7" />
              <circle cx="19" cy="16" r="2" fill="currentColor" opacity="0.7" />
              <circle cx="12" cy="20" r="2" fill="currentColor" opacity="0.7" />
              <circle cx="5" cy="16" r="2" fill="currentColor" opacity="0.7" />
              <circle cx="5" cy="8" r="2" fill="currentColor" opacity="0.7" />
              {/* Connection lines */}
              <path
                d="M12 6.5V9.5M12 14.5V17.5M14.2 10.5L16.8 8.5M14.2 13.5L16.8 15.5M9.8 10.5L7.2 8.5M9.8 13.5L7.2 15.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.5"
              />
            </svg>
          </div>
        </div>
      </div>
      {/* Text */}
      <div>
        <h1 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
          Research Agent
        </h1>
        <p className="text-xs text-muted">by Quercle</p>
      </div>
    </a>
  );
}
