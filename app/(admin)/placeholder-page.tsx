import MobileNavigation from "./mobile-navigation";

export default function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <main className="min-h-screen bg-[#f5f7f6] text-[#172b24]">
      <div className="mx-auto max-w-[1500px] px-5 py-5 sm:px-8 sm:py-7 xl:px-10">
        <div className="mb-5 flex items-center justify-between">
          <MobileNavigation />
          <span className="rounded-full bg-[#edf6f0] px-3 py-1.5 text-[10px] font-bold text-[#397b51]">
            Coming soon
          </span>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#528064]">
            Applicant workspace
          </p>
          <h1 className="mt-2 text-[26px] font-bold tracking-[-0.04em] text-[#1b3025] sm:text-[30px]">
            {title}
          </h1>
          <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-[#7c8a82]">
            {description}
          </p>
        </div>
        <section className="mt-7 rounded-2xl border border-[#e9eeea] bg-white p-6">
          <p className="text-sm font-semibold text-[#4c5e53]">
            This page is a placeholder. Applicant {title.toLowerCase()} features
            will be added here.
          </p>
        </section>
      </div>
    </main>
  );
}
