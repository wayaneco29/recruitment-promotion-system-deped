"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { handleLogin } from "@/actions/login.action";

export default function LoginForm() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    startTransition(async () => {
      const result = await handleLogin({ email, password });

      if (!result.success) {
        setErrorMessage(result.message);
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    });
  }

  const inputClassName =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100";

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-slate-700"
        >
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Enter your email"
          className={inputClassName}
          required
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-slate-700"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          className={inputClassName}
          required
        />
      </div>

      <div className="flex items-center justify-between gap-3 pt-1">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            name="remember"
            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          Remember me
        </label>
        <button
          type="button"
          className="text-sm font-medium text-emerald-700 transition hover:text-emerald-800"
        >
          Forgot password?
        </button>
      </div>

      {errorMessage && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 h-12 w-full rounded-xl border-0 bg-linear-to-r from-emerald-600 to-teal-500 text-base font-semibold text-white shadow-[0_14px_30px_rgba(16,185,129,0.35)] transition hover:from-emerald-500 hover:to-teal-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Signing in..." : "Login"}
      </button>
    </form>
  );
}
