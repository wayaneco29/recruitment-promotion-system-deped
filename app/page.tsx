import Image from "next/image";
import Link from "next/link";
import LoginForm from "./login-form";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_35%),linear-gradient(135deg,_#f0fdf4_0%,_#ecfeff_100%)] p-4 sm:p-6 lg:p-10">
      <div className="w-full max-w-6xl overflow-hidden rounded-[32px] border border-emerald-100 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.12)]">
        <div className="grid lg:grid-cols-[1.05fr_1.15fr]">
          <section className="flex items-center justify-center bg-white p-8 sm:p-10 lg:p-14">
            <div className="w-full max-w-md">
              <div className="mb-8 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 ring-1 ring-emerald-100">
                  <Image
                    src="/logo.png"
                    alt="Southern Leyte Division Logo"
                    width={52}
                    height={52}
                    priority
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                    Education Portal
                  </p>
                  <h1 className="mt-2 text-3xl font-bold text-slate-900">
                    Welcome back
                  </h1>
                </div>
              </div>

              <p className="mb-8 text-sm leading-6 text-slate-500">
                Sign in to access your dashboard, staff tools, and school
                services.
              </p>

              <LoginForm />
              <div className="divide-amber-50 h-px mt-6 w-full bg-gray-200" />
              <div className="mt-5 text-center">
                <Link
                  href="/signup"
                  className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100"
                >
                  Sign up for applicants
                </Link>
              </div>
              <div className="mt-8 text-center text-sm text-slate-500">
                Need help?{" "}
                <a
                  href="#"
                  className="font-medium text-emerald-700 hover:text-emerald-800"
                >
                  Contact support
                </a>
              </div>
            </div>
          </section>

          <section className="relative hidden min-h-[640px] lg:block">
            <Image
              src="/school.jpg"
              alt="School building"
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/50 via-emerald-800/20 to-transparent" />
            <div className="absolute inset-0 flex items-end p-8 xl:p-10">
              <div className="max-w-md rounded-[28px] border border-white/20 bg-white/10 p-6 text-white shadow-2xl backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100">
                  Southern Leyte Division
                </p>
                <h2 className="mt-4 text-3xl font-bold leading-tight">
                  Empowering learners and staff
                </h2>
                <p className="mt-4 text-sm leading-6 text-emerald-50/90">
                  Streamlined access to recruitment, promotion tools, and
                  essential school communication systems in one secure portal.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
