"use client";

import { useState } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { handleSignup } from "@/actions/signup.action";

const signupSchema = yup.object({
  firstName: yup.string().trim().required("First name is required."),
  lastName: yup.string().trim().required("Last name is required."),
  email: yup
    .string()
    .trim()
    .email("Enter a valid email address.")
    .required("Email address is required."),
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters.")
    .required("Password is required."),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords do not match.")
    .required("Please confirm your password."),
});

type SignupFormValues = yup.InferType<typeof signupSchema>;

export default function SignupForm() {
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: yupResolver(signupSchema),
    mode: "onBlur",
  });

  async function onSubmit(values: SignupFormValues) {
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const result = await handleSignup({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
      });

      if (!result.success) {
        setErrorMessage(result.message);
        return;
      }

      setSuccessMessage(
        result.requiresEmailConfirmation
          ? "Your account has been created. Check your email for a confirmation link before signing in."
          : "Your account has been created. You can now sign in.",
      );
      reset();
    } catch {
      setErrorMessage("We could not create your account. Please try again.");
    }
  }

  const inputClassName =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100";
  const labelClassName = "block text-sm font-medium text-slate-700";

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="firstName" className={labelClassName}>
            First name
          </label>
          <input
            id="firstName"
            type="text"
            autoComplete="given-name"
            placeholder="Your first name"
            className={inputClassName}
            aria-invalid={Boolean(errors.firstName)}
            aria-describedby={errors.firstName ? "firstName-error" : undefined}
            {...register("firstName")}
          />
          {errors.firstName && (
            <p id="firstName-error" className="text-sm text-red-600">
              {errors.firstName.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <label htmlFor="lastName" className={labelClassName}>
            Last name
          </label>
          <input
            id="lastName"
            type="text"
            autoComplete="family-name"
            placeholder="Your last name"
            className={inputClassName}
            aria-invalid={Boolean(errors.lastName)}
            aria-describedby={errors.lastName ? "lastName-error" : undefined}
            {...register("lastName")}
          />
          {errors.lastName && (
            <p id="lastName-error" className="text-sm text-red-600">
              {errors.lastName.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className={labelClassName}>
          Email address
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className={inputClassName}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
        />
        {errors.email && (
          <p id="email-error" className="text-sm text-red-600">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className={labelClassName}>
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          className={inputClassName}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "password-error" : undefined}
          {...register("password")}
        />
        {errors.password && (
          <p id="password-error" className="text-sm text-red-600">
            {errors.password.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="confirmPassword" className={labelClassName}>
          Confirm password
        </label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Enter your password again"
          className={inputClassName}
          aria-invalid={Boolean(errors.confirmPassword)}
          aria-describedby={
            errors.confirmPassword ? "confirmPassword-error" : undefined
          }
          {...register("confirmPassword")}
        />
        {errors.confirmPassword && (
          <p id="confirmPassword-error" className="text-sm text-red-600">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {errorMessage && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {errorMessage}
        </p>
      )}
      {successMessage && (
        <p
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          {successMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 h-12 w-full rounded-xl border-0 bg-linear-to-r from-emerald-600 to-teal-500 text-base font-semibold text-white shadow-[0_14px_30px_rgba(16,185,129,0.35)] transition hover:from-emerald-500 hover:to-teal-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Creating account..." : "Create applicant account"}
      </button>
    </form>
  );
}
