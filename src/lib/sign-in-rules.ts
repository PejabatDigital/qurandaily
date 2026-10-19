// Sign-in rules, shared by the Worker (which enforces them) and the sign-in screen.

/** How long an emailed code works. */
export const CODE_MINUTES = 10;
/** Wrong guesses allowed per code; after that a new code is needed. */
export const WRONG_GUESSES = 5;
/** Wait between codes sent to one email. */
export const RESEND_WAIT_SECONDS = 60;
/** Codes one email can be sent in an hour. */
export const CODES_PER_HOUR = 5;
