export default function DossierDetailLoading(): React.JSX.Element {
  return (
    <div className="flex-1 flex flex-col space-y-6 max-w-7xl w-full mx-auto p-4 sm:p-8 animate-pulse">
      {/* Top Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/70">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-3 w-32 bg-muted/60 rounded" />
            <span className="text-muted-foreground/60">•</span>
            <div className="h-3 w-24 bg-muted/60 rounded" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-80 bg-muted/80 rounded-lg" />
            <div className="h-5 w-24 bg-muted/60 rounded-full" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-28 bg-muted/60 rounded-md" />
          <div className="h-8 w-28 bg-muted/60 rounded-md" />
        </div>
      </div>

      {/* Main Split-Screen Workspace skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Pane skeleton */}
        <div className="lg:col-span-5 space-y-6">
          <div className="h-96 rounded-2xl border border-border/70 bg-card p-4 space-y-3">
            <div className="h-5 w-40 bg-muted/70 rounded" />
            <div className="h-3 w-64 bg-muted/40 rounded" />
            <div className="h-48 rounded-xl bg-muted/20 border border-dashed border-border/60 mt-4" />
          </div>
        </div>

        {/* Right Pane skeleton */}
        <div className="lg:col-span-7 space-y-6">
          <div className="h-96 rounded-2xl border border-border/70 bg-card p-4 space-y-4">
            <div className="h-5 w-48 bg-muted/70 rounded" />
            <div className="space-y-2">
              <div className="h-10 rounded-md bg-muted/30 border border-border/50" />
              <div className="h-10 rounded-md bg-muted/30 border border-border/50" />
            </div>
            <div className="h-28 rounded-md bg-muted/30 border border-border/50 mt-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
