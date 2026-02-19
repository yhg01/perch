// Activity monitoring thresholds
export const ACTIVE_TYPING_THRESHOLD = 30; // keys per 30s window
export const LIGHT_ACTIVITY_THRESHOLD = 5; // keys per 30s window
export const IDLE_DURATION_THRESHOLD = 120_000; // 2 minutes in ms
export const ACTIVITY_WINDOW_MS = 30_000; // 30-second sliding window

// Reminder intervals
export const STRETCH_REMINDER_MS = 45 * 60 * 1000; // 45 minutes
export const HYDRATION_REMINDER_MS = 60 * 60 * 1000; // 60 minutes
export const DISMISS_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes

// Animation
export const FRAME_RATE = 60;
export const BIRD_SIZE = 64;

// Time of day
export const SLEEPY_HOUR = 22; // 10 PM
export const MORNING_HOUR = 7; // 7 AM
