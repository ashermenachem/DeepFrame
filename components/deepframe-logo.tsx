import { useId } from 'react';

type DeepFrameMarkProps = {
  className?: string;
  monochrome?: boolean;
  title?: string;
};

/**
 * DeepFrame's Data Fold mark: a visible image plane folding open to expose
 * the structured layer underneath. Keep this geometry synchronized with the
 * SVG assets in public/brand.
 */
export function DeepFrameMark({
  className = '',
  monochrome = false,
  title,
}: DeepFrameMarkProps) {
  const rawId = useId().replace(/:/g, '');
  const gradientId = `${rawId}-deepframe-fold`;
  const glowId = `${rawId}-deepframe-glow`;

  return (
    <svg
      viewBox="0 0 64 64"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradientId} x1="11" y1="7" x2="54" y2="57">
          <stop stopColor="#F8FEFF" />
          <stop offset="0.42" stopColor="#8DEBFF" />
          <stop offset="1" stopColor="#9578FF" />
        </linearGradient>
        <filter id={glowId} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.2" result="blur" />
          <feColorMatrix
            in="blur"
            values="0 0 0 0 0.27 0 0 0 0 0.78 0 0 0 0 1 0 0 0 .42 0"
          />
        </filter>
      </defs>

      {!monochrome && (
        <path
          d="m15 7.8 33 4.4c2.3.3 4 2.3 4 4.6v30.4c0 2.3-1.7 4.3-4 4.6l-33 4.4c-2.1.3-4-1.4-4-3.5V11.3c0-2.1 1.9-3.8 4-3.5Z"
          stroke={`url(#${gradientId})`}
          strokeWidth="4"
          opacity="0.44"
          filter={`url(#${glowId})`}
        />
      )}
      <path
        d="m15 7.8 33 4.4c2.3.3 4 2.3 4 4.6v30.4c0 2.3-1.7 4.3-4 4.6l-33 4.4c-2.1.3-4-1.4-4-3.5V11.3c0-2.1 1.9-3.8 4-3.5Z"
        fill={monochrome ? 'none' : '#0A1222'}
        fillOpacity={monochrome ? undefined : '0.76'}
        stroke={monochrome ? 'currentColor' : `url(#${gradientId})`}
        strokeWidth={monochrome ? '4' : '2.5'}
        strokeLinejoin="round"
      />
      <path
        d="m22.3 20.2 18.2 9.9v12.1l-18.2 7.5V20.2Z"
        fill={monochrome ? 'none' : '#05070D'}
        stroke={monochrome ? 'currentColor' : `url(#${gradientId})`}
        strokeWidth={monochrome ? '4' : '2.35'}
        strokeLinejoin="round"
      />
      {!monochrome && (
        <>
          <path
            d="m15.6 9.1 32.7 4c1.8.2 3.2 1.8 3.2 3.7"
            stroke="white"
            strokeOpacity="0.72"
            strokeWidth="1.15"
            strokeLinecap="round"
          />
          <path
            d="M12.6 12.2v39.6c0 1.5 1.2 2.6 2.7 2.4l32.9-4"
            stroke="#A5F3FC"
            strokeOpacity="0.55"
            strokeWidth="0.8"
            strokeLinecap="round"
          />
          <path
            d="m22.3 20.2 18.2 9.9v12.1l-18.2 7.5"
            stroke="white"
            strokeOpacity="0.62"
            strokeWidth="0.9"
            strokeLinejoin="round"
          />
        </>
      )}
    </svg>
  );
}

type DeepFrameLogoProps = {
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
  creator?: boolean;
};

export function DeepFrameLogo({
  className = '',
  markClassName = 'size-9',
  wordmarkClassName = '',
  creator = false,
}: DeepFrameLogoProps) {
  return (
    <span className={`inline-flex min-w-0 items-center gap-2.5 ${className}`}>
      <span className="brand-mark-shell shrink-0">
        <DeepFrameMark className={markClassName} />
      </span>
      <span className="min-w-0 text-left">
        <span
          className={`brand-wordmark block truncate font-semibold leading-none tracking-[-0.045em] ${wordmarkClassName}`}
        >
          Deep<span>Frame</span>
        </span>
        {creator && (
          <span className="mt-1 block font-mono text-[7px] uppercase tracking-[0.18em] text-white/32">
            by Asher Menachem
          </span>
        )}
      </span>
    </span>
  );
}
