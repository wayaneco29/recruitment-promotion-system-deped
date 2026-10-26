export default function Loading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading page"
      className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_35%),linear-gradient(135deg,_#f0fdf4_0%,_#ecfeff_100%)] p-4 sm:p-6 lg:p-10"
    >
      <div
        role="status"
        className="w-full max-w-6xl overflow-hidden rounded-[32px] border border-emerald-100 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.12)]"
      >
        <span className="sr-only">Loading page content...</span>
        <div className="grid min-h-[640px] animate-pulse lg:grid-cols-[1.05fr_1.15fr]">
          <section className="flex items-center justify-center p-8 sm:p-10 lg:p-14">
            <div className="w-full max-w-md">
              <div className="mb-8 flex items-center gap-4">
                <div className="size-16 rounded-2xl bg-emerald-50" />
                <div className="flex-1 space-y-3">
                  <div className="h-3 w-32 rounded bg-emerald-100" />
                  <div className="h-8 w-56 max-w-full rounded bg-slate-200" />
                </div>
              </div>
              <div className="mb-8 h-4 w-11/12 rounded bg-slate-100" />
              <div className="space-y-5">
                <div className="space-y-2">
                  <div className="h-4 w-28 rounded bg-slate-100" />
                  <div className="h-12 rounded-xl bg-slate-100" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-20 rounded bg-slate-100" />
                  <div className="h-12 rounded-xl bg-slate-100" />
                </div>
                <div className="h-5 w-2/3 rounded bg-slate-100" />
                <div className="h-12 rounded-xl bg-emerald-100" />
              </div>
            </div>
          </section>
          <div
            aria-hidden="true"
            className="hidden bg-emerald-100 lg:block"
          />
        </div>
      </div>
    </main>
  );
}
