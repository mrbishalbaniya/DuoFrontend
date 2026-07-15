export const ABOUT_PLACEHOLDERS = {
  bio: 'Example: "I\'m a software engineer who enjoys hiking, coffee, and exploring new places. I value honesty, kindness, and meaningful conversations."',
  lookingFor:
    'Example: "I\'m looking for someone genuine, respectful, and interested in building a long-term relationship."',
  futureGoals:
    'Example: "I hope to grow professionally, travel more, and eventually build a happy family."',
} as const;

export const ABOUT_LIMITS = {
  bio: { min: 40, max: 500 },
  lookingForText: { min: 20, max: 400 },
  futureGoals: { min: 20, max: 400 },
} as const;
