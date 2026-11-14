interface BrandMarkProps {
  className?: string;
}

/**
 * Crisp 4-point luminous star emblem matching the GlobalMind AI orb & assistant avatar.
 */
export function BrandSparkle({ className = 'w-5 h-5' }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 2.5C12.75 7.45 14.55 9.25 19.5 10C14.55 10.75 12.75 12.55 12 17.5C11.25 12.55 9.45 10.75 4.5 10C9.45 9.25 11.25 7.45 12 2.5Z" />
      <path
        d="M18.2 14.5C18.55 16.4 19.3 17.15 21.2 17.5C19.3 17.85 18.55 18.6 18.2 20.5C17.85 18.6 17.1 17.85 15.2 17.5C17.1 17.15 17.85 16.4 18.2 14.5Z"
        opacity="0.88"
      />
    </svg>
  );
}

/**
 * Luminous frosted sky-blue AI orb shown on the empty chat welcome canvas.
 */
export function GlobalMindOrb({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const dimensions = size === 'lg' ? 'w-36 h-36 sm:w-44 sm:h-44' : 'w-28 h-28 sm:w-36 sm:h-36';
  const iconSize = size === 'lg' ? 'w-12 h-12 sm:w-14 sm:h-14' : 'w-10 h-10 sm:w-12 sm:h-12';

  return (
    <div className="relative inline-flex items-center justify-center select-none" aria-hidden="true">
      <div className="absolute -inset-4 rounded-full bg-sky-300/30 dark:bg-sky-500/20 blur-2xl pointer-events-none" />
      <div
        className={`relative ${dimensions} rounded-full flex items-center justify-center shadow-[0_14px_40px_rgba(78,168,255,0.28),inset_0_2px_12px_rgba(255,255,255,0.92)] dark:shadow-[0_14px_40px_rgba(37,99,235,0.35),inset_0_2px_10px_rgba(186,230,253,0.45)] border border-white/85 dark:border-sky-300/25`}
        style={{
          background:
            'radial-gradient(circle at 32% 28%, rgba(255,255,255,0.96) 0%, rgba(214,240,255,0.92) 38%, rgba(154,212,255,0.88) 72%, rgba(92,175,255,0.92) 100%)',
        }}
      >
        <div className="absolute inset-2 rounded-full bg-gradient-to-b from-white/50 via-transparent to-sky-400/20 pointer-events-none" />
        <BrandSparkle className={`${iconSize} text-white drop-shadow-[0_2px_8px_rgba(37,99,235,0.32)]`} />
      </div>
    </div>
  );
}
