/**
 * Every button and button-styled link, in one of three looks and one size.
 * Primary is the one thing a view wants you to do next — one per view;
 * secondary is everything else; danger is for the destructive.
 */
export const BUTTON = {
  primary:
    'inline-block bg-amber px-4 py-2 text-label tracking-label text-ink uppercase hover:bg-amber-soft',
  secondary:
    'inline-block border border-ink-edge px-4 py-2 text-label tracking-label text-parchment uppercase hover:border-amber hover:text-amber',
  danger:
    'inline-block border border-fault-line px-4 py-2 text-label tracking-label text-fault uppercase hover:border-fault disabled:cursor-not-allowed disabled:opacity-40',
} as const
