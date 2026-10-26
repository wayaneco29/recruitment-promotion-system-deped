export type ApplicantProfile = {
  email: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  name_suffix: string;
  phone_number: string;
  alternate_phone: string;
  residential_address: string;
  date_of_birth: string;
  sex: string;
  current_position: string;
  current_school_division: string;
  employee_number: string;
};

export type ApplicantProfileUpdate = Omit<ApplicantProfile, "email">;
