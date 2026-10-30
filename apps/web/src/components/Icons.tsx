/**
 * Clean monochrome SVG icons for gaming platforms
 */

export function SteamIcon({ className = "w-3.5 h-3.5 fill-current" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.979 0C5.678 0 .511 4.86.022 11.034l6.432 2.658c.545-.373 1.203-.597 1.912-.597.086 0 .17.006.254.013l2.955-4.281a4.26 4.26 0 0 1-.027-.477c0-2.36 1.91-4.27 4.27-4.27s4.27 1.91 4.27 4.27-1.91 4.27-4.27 4.27c-.205 0-.404-.02-.6-.051l-4.241 3.013c.005.074.012.148.012.224 0 1.956-1.585 3.542-3.541 3.542-1.637 0-3.013-1.111-3.42-2.624L.278 15.08C1.815 20.252 6.486 24 11.979 24c6.627 0 12-5.373 12-12S18.606 0 11.979 0zM7.55 17.158a1.597 1.597 0 1 0 1.597-1.597 1.596 1.596 0 0 0-1.597 1.597zm8.272-9.006a2.135 2.135 0 1 0 2.135-2.135 2.135 2.135 0 0 0-2.135 2.135z" />
    </svg>
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
