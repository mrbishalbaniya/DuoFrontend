import { z } from "zod";
import { isValidPhoneNumber } from "@/components/ui/phone-input";
import { calculateAgeFromDob } from "@/lib/age";

const phoneSchema = z
  .string()
  .min(1, "Phone number is required")
  .refine((value) => isValidPhoneNumber(value), "Enter a valid mobile number");

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Include at least one uppercase letter")
  .regex(/[0-9]/, "Include at least one number");

export const accountSchema = z
  .object({
    phone: phoneSchema,
    email: z.string().min(1, "Email is required").email("Enter a valid email"),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const otpSchema = z.object({
  otp: z
    .string()
    .length(6, "Enter the 6-digit code")
    .regex(/^\d{6}$/, "OTP must be 6 digits"),
});

export const basicInfoSchema = z
  .object({
    firstName: z.string().min(2, "First name is required"),
    lastName: z.string().min(2, "Last name is required"),
    gender: z.enum(["male", "female", "other"], { message: "Select gender" }),
    dateOfBirth: z.string().min(1, "Date of birth is required"),
    heightFeet: z.coerce.number().min(4).max(7),
    heightInches: z.coerce.number().min(0).max(11),
    maritalStatus: z.enum(["never_married", "divorced", "widowed"], {
      message: "Select marital status",
    }),
    relationshipGoal: z.enum(["dating", "serious", "marriage", "friendship"], {
      message: "Select relationship goal",
    }),
  })
  .superRefine((data, ctx) => {
    const age = calculateAgeFromDob(data.dateOfBirth);
    if (age < 18) {
      ctx.addIssue({
        code: "custom",
        message: "You must be at least 18 years old",
        path: ["dateOfBirth"],
      });
    }
  });

export const locationSchema = z.object({
  country: z.string().min(1, "Country is required"),
  province: z.string().min(1, "Select a province"),
  district: z.string().min(2, "District is required"),
  municipality: z.string().min(2, "Municipality or city is required"),
  currentLocation: z.string().optional(),
});

export const educationSchema = z.object({
  educationLevel: z.enum(["see", "plus_two", "diploma", "bachelor", "master", "phd"], {
    message: "Select education level",
  }),
  fieldOfStudy: z.enum(
    ["it", "engineering", "medical", "business", "law", "arts", "agriculture", "other"],
    { message: "Select field of study" }
  ),
  employment: z.enum(
    ["student", "employed", "self_employed", "freelancer", "business_owner", "unemployed"],
    { message: "Select employment status" }
  ),
  occupation: z.string().min(2, "Occupation is required"),
  company: z.string().optional(),
  monthlyIncome: z.enum(["below_20k", "20k_50k", "50k_100k", "100k_200k", "200k_plus"], {
    message: "Select income range",
  }),
});

export const religionSchema = z.object({
  religion: z.enum(["hindu", "buddhist", "muslim", "christian", "kirat", "other"], {
    message: "Select religion",
  }),
  caste: z.string().min(1, "Select caste"),
  gotra: z.string().min(1, "Select gotra"),
  horoscope: z.enum(["required", "not_required"], {
    message: "Select horoscope preference",
  }),
  birthTime: z.string().optional(),
  birthPlace: z.string().optional(),
});

export const lifestyleSchema = z.object({
  personality: z.enum(["introvert", "ambivert", "extrovert"], {
    message: "Select personality",
  }),
  lifestyle: z.enum(["active", "balanced", "relaxed"], {
    message: "Select lifestyle",
  }),
  smoking: z.enum(["no", "occasionally", "yes"], { message: "Select smoking preference" }),
  drinking: z.enum(["no", "occasionally", "yes"], { message: "Select drinking preference" }),
  exercise: z.enum(["gym", "yoga", "sports", "running", "none"], {
    message: "Select exercise preference",
  }),
});

export const interestsSchema = z.object({
  interests: z.array(z.string()).min(5, "Select at least 5 interests"),
});

export const preferencesSchema = z
  .object({
    lookingFor: z.enum(["male", "female", "everyone"], {
      message: "Select who you are looking for",
    }),
    prefAgeMin: z.coerce.number().min(18, "Minimum age is 18").max(80),
    prefAgeMax: z.coerce.number().min(18, "Maximum age is 80").max(80),
    distancePreference: z.enum(["5", "10", "25", "50", "anywhere"], {
      message: "Select distance preference",
    }),
    preferredReligion: z.enum(["hindu", "buddhist", "muslim", "christian", "kirat", "other"], {
      message: "Select preferred religion",
    }),
    interCaste: z.enum(["yes", "no", "depends"], {
      message: "Select inter-caste preference",
    }),
    interReligion: z.enum(["yes", "no", "depends"], {
      message: "Select inter-religion preference",
    }),
  })
  .refine((data) => data.prefAgeMin <= data.prefAgeMax, {
    message: "Minimum age must be less than maximum age",
    path: ["prefAgeMax"],
  });

export const aboutSchema = z.object({
  bio: z.string().min(40, "Bio should be at least 40 characters"),
  lookingForText: z.string().min(20, "Tell us what you are looking for"),
  futureGoals: z.string().min(20, "Share your future goals"),
});

export const photosSchema = z.object({
  photos: z
    .array(
      z.object({
        id: z.string(),
        fileName: z.string(),
        previewUrl: z.string(),
        isProfile: z.boolean(),
      })
    )
    .min(2, "Upload at least 2 photos")
    .max(9, "Maximum 9 photos allowed"),
});

export type AccountFormValues = z.infer<typeof accountSchema>;
export type OtpFormValues = z.infer<typeof otpSchema>;
export type BasicInfoFormValues = z.infer<typeof basicInfoSchema>;
export type LocationFormValues = z.infer<typeof locationSchema>;
export type EducationFormValues = z.infer<typeof educationSchema>;
export type ReligionFormValues = z.infer<typeof religionSchema>;
export type LifestyleFormValues = z.infer<typeof lifestyleSchema>;
export type InterestsFormValues = z.infer<typeof interestsSchema>;
export type PreferencesFormValues = z.infer<typeof preferencesSchema>;
export type AboutFormValues = z.infer<typeof aboutSchema>;
export type PhotosFormValues = z.infer<typeof photosSchema>;

export function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 2) return { score, label: "Weak", color: "bg-error" };
  if (score <= 3) return { score, label: "Fair", color: "bg-accent" };
  if (score <= 4) return { score, label: "Good", color: "bg-primary" };
  return { score, label: "Strong", color: "bg-love" };
}
