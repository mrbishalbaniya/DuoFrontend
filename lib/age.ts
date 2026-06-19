/** Age from ISO date string (YYYY-MM-DD). */
export function calculateAgeFromDob(dob: string): number {
  const birth = new Date(`${dob}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return 0;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }

  return age;
}

/** Latest birth date for someone who is at least `minAge` years old. */
export function maxBirthDateForMinAge(minAge = 18): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() - minAge);
  return date.toISOString().slice(0, 10);
}

export function minBirthDate(maxAge = 100): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() - maxAge);
  return date.toISOString().slice(0, 10);
}
