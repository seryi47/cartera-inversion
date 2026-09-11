export default function Logo({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className="shrink-0" aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="#FFF3DE" />
      <circle cx="16" cy="20" r="7" fill="#8A6642" />
      <circle cx="48" cy="20" r="7" fill="#8A6642" />
      <circle cx="16" cy="20" r="3.4" fill="#C79A6B" />
      <circle cx="48" cy="20" r="3.4" fill="#C79A6B" />
      <rect x="10" y="18" width="44" height="34" rx="17" fill="#B98C5E" />
      <rect x="18" y="36" width="28" height="16" rx="8" fill="#DDBB8E" />
      <ellipse cx="27" cy="45" rx="2.6" ry="2" fill="#5C3E26" />
      <ellipse cx="37" cy="45" rx="2.6" ry="2" fill="#5C3E26" />
      <path d="M20 30 q4 -3 8 0" stroke="#4A2F1C" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M36 30 q4 -3 8 0" stroke="#4A2F1C" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path
        d="M48 8c-2.2 0-4 1.6-4 3.9 0 3.3 4 6.1 4 6.1s4-2.8 4-6.1c0-2.3-1.8-3.9-4-3.9z"
        fill="#F0678A"
      />
    </svg>
  );
}
