import { FirebaseError } from "firebase/app";

export function getFirebaseAuthErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/configuration-not-found":
        return "Phone sign-in is not enabled in Firebase. Open Firebase Console → Authentication → Sign-in method → enable Phone, then add localhost to Authorized domains.";
      case "auth/invalid-phone-number":
        return "Invalid phone number. Use full format, e.g. +97798XXXXXXXX.";
      case "auth/too-many-requests":
        return "Too many attempts. Wait a few minutes and try again.";
      case "auth/captcha-check-failed":
        return "reCAPTCHA verification failed. Refresh the page and try again.";
      case "auth/invalid-verification-code":
        return "Invalid verification code. Check the SMS and try again.";
      case "auth/code-expired":
        return "Verification code expired. Request a new code.";
      case "auth/billing-not-enabled":
        return "Real SMS needs Blaze billing. For free testing, add a test phone in Firebase Console, tap Use test number, then enter your test OTP code.";
      case "auth/operation-not-allowed":
        return "SMS to this country is blocked. In Firebase Console → Authentication → Settings → SMS region policy, allow Nepal (+977).";
      case "auth/quota-exceeded":
        return "SMS quota exceeded. Try again later or use a Firebase test phone number.";
      default:
        return error.message || "Firebase authentication failed.";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Firebase authentication failed.";
}
