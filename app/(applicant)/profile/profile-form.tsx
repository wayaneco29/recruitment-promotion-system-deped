"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { message } from "antd";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { updateApplicantProfile } from "@/actions/applicant-profile.action";
import MobileNavigation from "../../dashboard/mobile-navigation";
import ApplicantWorkspaceHeader from "../../dashboard/applicant-workspace-header";
import type { ApplicantProfile, ApplicantProfileUpdate } from "./types";

const sexOptions = ["", "Female", "Male", "Prefer not to say"] as const;

const profileSchema: yup.ObjectSchema<ApplicantProfileUpdate> = yup.object({
  first_name: yup
    .string()
    .trim()
    .max(100, "First name must be 100 characters or fewer.")
    .required("First name is required."),
  middle_name: yup
    .string()
    .trim()
    .max(100, "Middle name must be 100 characters or fewer.")
    .defined(),
  last_name: yup
    .string()
    .trim()
    .max(100, "Last name must be 100 characters or fewer.")
    .required("Last name is required."),
  name_suffix: yup
    .string()
    .trim()
    .max(20, "Name suffix must be 20 characters or fewer.")
    .defined(),
  phone_number: yup
    .string()
    .trim()
    .max(50, "Contact number must be 50 characters or fewer.")
    .defined(),
  alternate_phone: yup
    .string()
    .trim()
    .max(50, "Alternate number must be 50 characters or fewer.")
    .defined(),
  residential_address: yup
    .string()
    .trim()
    .max(1000, "Address must be 1,000 characters or fewer.")
    .defined(),
  date_of_birth: yup
    .string()
    .defined()
    .test(
      "valid-date-of-birth",
      "Enter a valid date of birth that is not in the future.",
      (value) => {
        if (!value) return true;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
        const parsed = new Date(`${value}T00:00:00.000Z`);
        return (
          !Number.isNaN(parsed.getTime()) &&
          parsed.toISOString().slice(0, 10) === value &&
          value <= new Date().toISOString().slice(0, 10)
        );
      },
    ),
  sex: yup.string().oneOf(sexOptions, "Choose a valid sex option.").defined(),
  current_position: yup
    .string()
    .trim()
    .max(150, "Current position must be 150 characters or fewer.")
    .defined(),
  current_school_division: yup
    .string()
    .trim()
    .max(200, "School or division must be 200 characters or fewer.")
    .defined(),
  employee_number: yup
    .string()
    .trim()
    .max(50, "Employee number must be 50 characters or fewer.")
    .defined(),
});

const inputClassName =
  "w-full rounded-xl border border-[#dfe8e2] bg-white px-3.5 py-3 text-sm text-[#24372c] outline-none transition placeholder:text-[#a0ada5] focus:border-[#4a9167] focus:ring-4 focus:ring-[#e8f3ec] disabled:bg-[#f5f7f6]";
const labelClassName = "mb-1.5 block text-xs font-semibold text-[#53645a]";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;

  return (
    <p id={id} className="mt-1.5 text-xs text-red-600">
      {message}
    </p>
  );
}

export default function ProfileForm({
  initialProfile,
  applicantScore,
}: {
  initialProfile: ApplicantProfile;
  applicantScore: number | null;
}) {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ApplicantProfileUpdate>({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      first_name: initialProfile.first_name,
      middle_name: initialProfile.middle_name,
      last_name: initialProfile.last_name,
      name_suffix: initialProfile.name_suffix,
      phone_number: initialProfile.phone_number,
      alternate_phone: initialProfile.alternate_phone,
      residential_address: initialProfile.residential_address,
      date_of_birth: initialProfile.date_of_birth,
      sex: initialProfile.sex,
      current_position: initialProfile.current_position,
      current_school_division: initialProfile.current_school_division,
      employee_number: initialProfile.employee_number,
    },
    mode: "onBlur",
  });

  async function submitProfile(values: ApplicantProfileUpdate) {
    setServerError("");

    try {
      const result = await updateApplicantProfile(values);

      if (!result.success) {
        setServerError(result.message);
        return;
      }

      messageApi.success("Your profile has been saved.");
      reset(values, { keepDirty: false });
      router.refresh();
    } catch {
      setServerError("We could not save your profile. Please try again.");
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7f6] text-[#172b24]">
      {contextHolder}
      <div className="mx-auto max-w-[1500px] px-5 py-5 sm:px-8 sm:py-7 xl:px-10">
        <div className="mb-5 flex items-center justify-between">
          <MobileNavigation />
          <span className="rounded-full bg-[#edf6f0] px-3 py-1.5 text-[10px] font-bold text-[#397b51]">
            Applicant profile
          </span>
        </div>

        <ApplicantWorkspaceHeader
          title="Profile"
          description="Keep your personal and current employment information accurate for your application."
          score={applicantScore}
        />

        <form
          className="mt-7 space-y-5"
          onSubmit={handleSubmit(submitProfile)}
          noValidate
        >
          <fieldset disabled={isSubmitting} className="space-y-5">
            <section className="rounded-2xl border border-[#e7ede8] bg-white p-5 sm:p-7">
              <div className="mb-5">
                <h2 className="text-base font-bold text-[#24372c]">
                  Personal information
                </h2>
                <p className="mt-1 text-xs text-[#859189]">
                  Enter your name as it appears on your official records.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div>
                  <label className={labelClassName} htmlFor="first_name">
                    First name <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="first_name"
                    className={inputClassName}
                    aria-invalid={Boolean(errors.first_name)}
                    aria-describedby={
                      errors.first_name ? "first_name-error" : undefined
                    }
                    autoComplete="given-name"
                    maxLength={100}
                    {...register("first_name")}
                  />
                  <FieldError
                    id="first_name-error"
                    message={errors.first_name?.message}
                  />
                </div>
                <div>
                  <label className={labelClassName} htmlFor="middle_name">
                    Middle name
                  </label>
                  <input
                    id="middle_name"
                    className={inputClassName}
                    aria-invalid={Boolean(errors.middle_name)}
                    aria-describedby={
                      errors.middle_name ? "middle_name-error" : undefined
                    }
                    autoComplete="additional-name"
                    maxLength={100}
                    {...register("middle_name")}
                  />
                  <FieldError
                    id="middle_name-error"
                    message={errors.middle_name?.message}
                  />
                </div>
                <div>
                  <label className={labelClassName} htmlFor="last_name">
                    Last name <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="last_name"
                    className={inputClassName}
                    aria-invalid={Boolean(errors.last_name)}
                    aria-describedby={
                      errors.last_name ? "last_name-error" : undefined
                    }
                    autoComplete="family-name"
                    maxLength={100}
                    {...register("last_name")}
                  />
                  <FieldError
                    id="last_name-error"
                    message={errors.last_name?.message}
                  />
                </div>
                <div>
                  <label className={labelClassName} htmlFor="name_suffix">
                    Name suffix
                  </label>
                  <input
                    id="name_suffix"
                    className={inputClassName}
                    aria-invalid={Boolean(errors.name_suffix)}
                    aria-describedby={
                      errors.name_suffix ? "name_suffix-error" : undefined
                    }
                    placeholder="Jr., III"
                    maxLength={20}
                    {...register("name_suffix")}
                  />
                  <FieldError
                    id="name_suffix-error"
                    message={errors.name_suffix?.message}
                  />
                </div>
                <div>
                  <label className={labelClassName} htmlFor="date_of_birth">
                    Date of birth
                  </label>
                  <input
                    id="date_of_birth"
                    type="date"
                    max={new Date().toISOString().slice(0, 10)}
                    className={inputClassName}
                    aria-invalid={Boolean(errors.date_of_birth)}
                    aria-describedby={
                      errors.date_of_birth ? "date_of_birth-error" : undefined
                    }
                    {...register("date_of_birth")}
                  />
                  <FieldError
                    id="date_of_birth-error"
                    message={errors.date_of_birth?.message}
                  />
                </div>
                <div>
                  <label className={labelClassName} htmlFor="sex">
                    Sex
                  </label>
                  <select
                    id="sex"
                    className={inputClassName}
                    aria-invalid={Boolean(errors.sex)}
                    aria-describedby={errors.sex ? "sex-error" : undefined}
                    {...register("sex")}
                  >
                    <option value="">Select an option</option>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                  <FieldError id="sex-error" message={errors.sex?.message} />
                </div>
                <div>
                  <label className={labelClassName} htmlFor="email">
                    Account email
                  </label>
                  <input
                    id="email"
                    type="email"
                    className={`${inputClassName} cursor-not-allowed`}
                    value={initialProfile.email}
                    readOnly
                    autoComplete="email"
                  />
                  <p className="mt-1.5 text-[11px] text-[#859189]">
                    Email changes are managed through your account settings.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-[#e7ede8] bg-white p-5 sm:p-7">
              <div className="mb-5">
                <h2 className="text-base font-bold text-[#24372c]">
                  Contact and address
                </h2>
                <p className="mt-1 text-xs text-[#859189]">
                  Add the best way to reach you and your current residential
                  address.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClassName} htmlFor="phone_number">
                    Contact number
                  </label>
                  <input
                    id="phone_number"
                    type="tel"
                    className={inputClassName}
                    aria-invalid={Boolean(errors.phone_number)}
                    aria-describedby={
                      errors.phone_number ? "phone_number-error" : undefined
                    }
                    autoComplete="tel"
                    maxLength={50}
                    placeholder="e.g. 09XX XXX XXXX"
                    {...register("phone_number")}
                  />
                  <FieldError
                    id="phone_number-error"
                    message={errors.phone_number?.message}
                  />
                </div>
                <div>
                  <label className={labelClassName} htmlFor="alternate_phone">
                    Alternate contact number
                  </label>
                  <input
                    id="alternate_phone"
                    type="tel"
                    className={inputClassName}
                    aria-invalid={Boolean(errors.alternate_phone)}
                    aria-describedby={
                      errors.alternate_phone
                        ? "alternate_phone-error"
                        : undefined
                    }
                    maxLength={50}
                    placeholder="Optional"
                    {...register("alternate_phone")}
                  />
                  <FieldError
                    id="alternate_phone-error"
                    message={errors.alternate_phone?.message}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label
                    className={labelClassName}
                    htmlFor="residential_address"
                  >
                    Current residential address
                  </label>
                  <textarea
                    id="residential_address"
                    className={`${inputClassName} min-h-24 resize-y`}
                    aria-invalid={Boolean(errors.residential_address)}
                    aria-describedby={
                      errors.residential_address
                        ? "residential_address-error"
                        : undefined
                    }
                    autoComplete="street-address"
                    maxLength={1000}
                    placeholder="House/building, street, barangay, municipality/city, province, postal code"
                    {...register("residential_address")}
                  />
                  <FieldError
                    id="residential_address-error"
                    message={errors.residential_address?.message}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-[#e7ede8] bg-white p-5 sm:p-7">
              <div className="mb-5">
                <h2 className="text-base font-bold text-[#24372c]">
                  Current employment
                </h2>
                <p className="mt-1 text-xs text-[#859189]">
                  These details are optional and can be updated whenever your
                  employment information changes.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClassName} htmlFor="current_position">
                    Current position
                  </label>
                  <input
                    id="current_position"
                    className={inputClassName}
                    aria-invalid={Boolean(errors.current_position)}
                    aria-describedby={
                      errors.current_position
                        ? "current_position-error"
                        : undefined
                    }
                    maxLength={150}
                    placeholder="e.g. Teacher III"
                    {...register("current_position")}
                  />
                  <FieldError
                    id="current_position-error"
                    message={errors.current_position?.message}
                  />
                </div>
                <div>
                  <label
                    className={labelClassName}
                    htmlFor="current_school_division"
                  >
                    Current school or division
                  </label>
                  <input
                    id="current_school_division"
                    className={inputClassName}
                    aria-invalid={Boolean(errors.current_school_division)}
                    aria-describedby={
                      errors.current_school_division
                        ? "current_school_division-error"
                        : undefined
                    }
                    maxLength={200}
                    placeholder="School, district, or division"
                    {...register("current_school_division")}
                  />
                  <FieldError
                    id="current_school_division-error"
                    message={errors.current_school_division?.message}
                  />
                </div>
                <div>
                  <label className={labelClassName} htmlFor="employee_number">
                    Employee number
                  </label>
                  <input
                    id="employee_number"
                    className={inputClassName}
                    aria-invalid={Boolean(errors.employee_number)}
                    aria-describedby={
                      errors.employee_number
                        ? "employee_number-error"
                        : undefined
                    }
                    maxLength={50}
                    {...register("employee_number")}
                  />
                  <FieldError
                    id="employee_number-error"
                    message={errors.employee_number?.message}
                  />
                </div>
              </div>
            </section>
          </fieldset>

          {serverError && (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {serverError}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !isDirty}
              className="inline-flex min-w-36 items-center justify-center rounded-xl bg-[#24764b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1e633e] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Saving profile..." : "Save profile"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
