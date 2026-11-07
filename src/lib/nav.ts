// Shared by the bottom bar (components/BottomBar.tsx) and the pages that show it.

/** Opening Home with this state opens the log sheet there (see pages/Index.tsx). */
export const OPEN_LOG = { log: true } as const;

/** Room to leave at the bottom of a page so the bottom bar doesn't cover its end. */
export const BAR_SPACE = "pb-[calc(112px+env(safe-area-inset-bottom))]";
