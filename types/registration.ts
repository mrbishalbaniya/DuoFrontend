export type RegistrationStep =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11;

export type GenderOption = "male" | "female" | "other";
export type MaritalStatus = "never_married" | "divorced" | "widowed";
export type RelationshipGoal =
  | "dating"
  | "serious"
  | "marriage"
  | "friendship";
export type EducationLevel =
  | "see"
  | "plus_two"
  | "diploma"
  | "bachelor"
  | "master"
  | "phd";
export type FieldOfStudy =
  | "it"
  | "engineering"
  | "medical"
  | "business"
  | "law"
  | "arts"
  | "agriculture"
  | "other";
export type EmploymentStatus =
  | "student"
  | "employed"
  | "self_employed"
  | "freelancer"
  | "business_owner"
  | "unemployed";
export type IncomeRange =
  | "below_20k"
  | "20k_50k"
  | "50k_100k"
  | "100k_200k"
  | "200k_plus";
export type ReligionOption =
  | "hindu"
  | "buddhist"
  | "muslim"
  | "christian"
  | "kirat"
  | "other";
export type HoroscopeRequirement = "required" | "not_required";
export type PersonalityType = "introvert" | "ambivert" | "extrovert";
export type LifestylePace = "active" | "balanced" | "relaxed";
export type FrequencyOption = "no" | "occasionally" | "yes";
export type ExerciseOption =
  | "gym"
  | "yoga"
  | "sports"
  | "running"
  | "none";
export type LookingForOption = "male" | "female" | "everyone";
export type DistancePreference =
  | "5"
  | "10"
  | "25"
  | "50"
  | "anywhere";
export type MarriagePreference = "yes" | "no" | "depends";

export interface RegistrationPhoto {
  id: string;
  fileName: string;
  previewUrl: string;
  isProfile: boolean;
}

export interface RegistrationData {
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  otpVerified: boolean;
  signedUpWithGoogle: boolean;

  firstName: string;
  lastName: string;
  gender: GenderOption | "";
  dateOfBirth: string;
  heightFeet: number | "";
  heightInches: number | "";
  maritalStatus: MaritalStatus | "";
  relationshipGoal: RelationshipGoal | "";

  country: string;
  province: string;
  district: string;
  municipality: string;
  currentLocation: string;
  gpsEnabled: boolean;

  educationLevel: EducationLevel | "";
  fieldOfStudy: FieldOfStudy | "";
  employment: EmploymentStatus | "";
  occupation: string;
  company: string;
  monthlyIncome: IncomeRange | "";

  religion: ReligionOption | "";
  caste: string;
  gotra: string;
  horoscope: HoroscopeRequirement | "";
  birthTime: string;
  birthPlace: string;

  personality: PersonalityType | "";
  lifestyle: LifestylePace | "";
  smoking: FrequencyOption | "";
  drinking: FrequencyOption | "";
  exercise: ExerciseOption | "";

  interests: string[];

  lookingFor: LookingForOption | "";
  prefAgeMin: number;
  prefAgeMax: number;
  distancePreference: DistancePreference | "";
  preferredReligion: ReligionOption | "";
  interCaste: MarriagePreference | "";
  interReligion: MarriagePreference | "";

  bio: string;
  lookingForText: string;
  futureGoals: string;

  photos: RegistrationPhoto[];
}

export const REGISTRATION_STEP_LABELS: Record<RegistrationStep, string> = {
  1: "Account",
  2: "Basic Info",
  3: "Location",
  4: "Education",
  5: "Religion",
  6: "Lifestyle",
  7: "Interests",
  8: "Preferences",
  9: "About",
  10: "Photos",
  11: "Review",
};

export const TOTAL_REGISTRATION_STEPS = 11;

export const initialRegistrationData = (): RegistrationData => ({
  phone: "",
  email: "",
  password: "",
  confirmPassword: "",
  otpVerified: false,
  signedUpWithGoogle: false,
  firstName: "",
  lastName: "",
  gender: "",
  dateOfBirth: "",
  heightFeet: "",
  heightInches: "",
  maritalStatus: "",
  relationshipGoal: "",
  country: "Nepal",
  province: "",
  district: "",
  municipality: "",
  currentLocation: "",
  gpsEnabled: false,
  educationLevel: "",
  fieldOfStudy: "",
  employment: "",
  occupation: "",
  company: "",
  monthlyIncome: "",
  religion: "",
  caste: "",
  gotra: "",
  horoscope: "",
  birthTime: "",
  birthPlace: "",
  personality: "",
  lifestyle: "",
  smoking: "",
  drinking: "",
  exercise: "",
  interests: [],
  lookingFor: "",
  prefAgeMin: 22,
  prefAgeMax: 35,
  distancePreference: "",
  preferredReligion: "",
  interCaste: "",
  interReligion: "",
  bio: "",
  lookingForText: "",
  futureGoals: "",
  photos: [],
});
