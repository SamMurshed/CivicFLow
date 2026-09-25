'use client';

/**
 * NavIcon — renders a 24×24 outline icon from a raw SVG path string.
 */

interface NavIconProps {
  path: string;
  className?: string;
  'aria-hidden'?: boolean;
}

export default function NavIcon({
  path,
  className = 'h-5 w-5',
  'aria-hidden': ariaHidden = true,
}: NavIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden={ariaHidden}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}
