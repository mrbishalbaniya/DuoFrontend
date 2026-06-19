import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from "firebase/auth";
import { getFirebaseApp } from "@/lib/firebase/client";

let recaptchaVerifier: RecaptchaVerifier | null = null;
let confirmationResult: ConfirmationResult | null = null;

function getFirebaseAuth() {
  const app = getFirebaseApp();
  if (!app) {
    throw new Error("Firebase is not configured.");
  }
  return getAuth(app);
}

export async function sendFirebasePhoneOtp(
  phoneNumber: string,
  containerId = "firebase-recaptcha"
): Promise<void> {
  const auth = getFirebaseAuth();

  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
  }

  recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: "invisible",
  });

  confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
}

export async function verifyFirebasePhoneOtp(otp: string): Promise<string> {
  if (!confirmationResult) {
    throw new Error("Request a verification code first.");
  }

  const credential = await confirmationResult.confirm(otp);
  return credential.user.getIdToken();
}

export function resetFirebasePhoneOtp(): void {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
  }
  confirmationResult = null;
}
