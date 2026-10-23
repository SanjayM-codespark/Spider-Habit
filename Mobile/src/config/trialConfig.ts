// ============================================================
// FREE TRIAL CONFIG — THE TIMING KNOB FOR THE WHOLE FEATURE
// ============================================================
// A free (non-subscribed) user's habits are automatically deleted
// when this much time has passed since they logged in, to encourage
// them to subscribe.
//
// >>> HOW TO REDUCE/INCREASE THE TIMING FOR TESTING <<<
//   Edit FREE_TRIAL_DURATION_MS below. Value is in milliseconds.
//
//   Examples:
//     10 minutes (production default):  10 * 60 * 1000
//     1 minute (quick test):            60 * 1000
//     15 seconds (fastest test):        15 * 1000
//
//   After changing it, reload/rebuild the app.
// ============================================================

export const FREE_TRIAL_DURATION_MS: number = 30 * 24 * 60 * 60 * 1000;

/**
 * How often (ms) the countdown clock checks the elapsed time.
 * 1000ms = every 1 second, so the Dashboard countdown also updates
 * second by second while you test. No need to touch this normally.
 */
export const FREE_TRIAL_TICK_MS: number = 1000;