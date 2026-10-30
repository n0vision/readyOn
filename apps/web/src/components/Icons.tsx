/**
 * Clean monochrome SVG icons for gaming platforms
 */

import steamLogo from "../assets/steam.png";

export function SteamIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <img
      src={steamLogo}
      alt="Steam"
      className={`${className} object-contain inline-block shrink-0 rounded-full`}
      loading="eager"
    />
  );
}

export function FaceitIcon({ className = "w-3.5 h-3.5 fill-current" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 782 619" fill="currentColor">
      {/* Official FACEIT chevron with subtle facet dimensionality */}
      <path d="M572 310L782 0v310Z" opacity="0.8" />
      <path d="M0 310h782v309Z" />
    </svg>
  );
}
