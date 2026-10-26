export default function Loading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading dashboard page"
      className="min-h-screen bg-[#f5f7f6] text-[#172b24]"
    >
      <div
        role="status"
        className="mx-auto max-w-[1500px] px-5 py-5 sm:px-8 sm:py-7 xl:px-10"
      >
        <span className="sr-only">Loading dashboard page...</span>
        <div className="animate-pulse">
          <div className="mb-5 flex items-center justify-between">
            <div className="h-9 w-28 rounded-xl bg-[#e8eeea]" />
            <div className="h-7 w-24 rounded-full bg-[#e8eeea]" />
          </div>
          <div className="space-y-3">
            <div className="h-3 w-32 rounded bg-[#e2e9e4]" />
            <div className="h-9 w-64 max-w-full rounded bg-[#e2e9e4]" />
            <div className="h-4 w-2/3 max-w-xl rounded bg-[#e8eeea]" />
          </div>
          <section
            aria-hidden="true"
            className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            {Array.from({ length: 4 }, (_, index) => (
              <div
                key={index}
                className="rounded-2xl border border-[#e9eeea] bg-white p-5"
              >
                <div className="h-3 w-2/3 rounded bg-[#edf1ee]" />
                <div className="mt-4 h-8 w-1/2 rounded bg-[#e8eeea]" />
                <div className="mt-3 h-3 w-3/4 rounded bg-[#f0f3f1]" />
              </div>
            ))}
          </section>
          <section
            aria-hidden="true"
            className="mt-5 overflow-hidden rounded-2xl border border-[#e9eeea] bg-white"
          >
            <div className="space-y-3 px-5 py-5 sm:px-6">
              <div className="h-4 w-40 rounded bg-[#e8eeea]" />
              <div className="h-3 w-64 max-w-full rounded bg-[#f0f3f1]" />
            </div>
            <div className="border-y border-[#eef1ef] bg-[#fafbfa] px-5 py-3 sm:px-6">
              <div className="flex gap-8">
                {Array.from({ length: 4 }, (_, index) => (
                  <div
                    key={index}
                    className="h-3 flex-1 rounded bg-[#edf1ee]"
                  />
                ))}
              </div>
            </div>
            <div className="space-y-5 p-5 sm:px-6">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="flex gap-8">
                  {Array.from({ length: 4 }, (_, cellIndex) => (
                    <div
                      key={cellIndex}
                      className="h-3 flex-1 rounded bg-[#f0f3f1]"
                    />
                  ))}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
