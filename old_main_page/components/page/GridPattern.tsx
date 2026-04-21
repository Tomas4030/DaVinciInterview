import { memo } from "react";

const GridPattern = memo(function GridPattern() {
  return (
    <svg
      className="absolute inset-0 h-full w-full opacity-40"
      aria-hidden="true"
    >
      <defs>
        <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
          <path
            d="M 32 0 L 0 0 0 32"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-[var(--c-border)]/20"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  );
});

export default GridPattern;
