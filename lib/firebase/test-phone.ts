export type FirebaseTestPhoneConfig = {
  phone: string;
  otp: string;
};

export function getFirebaseTestPhoneConfig(): FirebaseTestPhoneConfig | null {
  const phone = process.env.NEXT_PUBLIC_FIREBASE_TEST_PHONE?.trim();
  const otp = process.env.NEXT_PUBLIC_FIREBASE_TEST_OTP?.trim();

  if (!phone || !otp) {
    return null;
  }

  return { phone, otp };
}

export function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits ? `+${digits}` : "";
}

export function isFirebaseTestPhone(phoneNumber: string): boolean {
  const config = getFirebaseTestPhoneConfig();
  if (!config) return false;
  return normalizePhone(phoneNumber) === normalizePhone(config.phone);
}
