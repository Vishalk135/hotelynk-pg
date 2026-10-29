export default function Logo({ className = "h-7 w-7" }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="hotelynkLogoGrad"
          x1="2"
          y1="1"
          x2="30"
          y2="31"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#8C6FFF" />
          <stop offset="50%" stopColor="#6754F5" />
          <stop offset="100%" stopColor="#1FCBE0" />
        </linearGradient>
        <linearGradient
          id="hotelynkGlassHi"
          x1="16"
          y1="0"
          x2="16"
          y2="15"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <clipPath id="hotelynkBadgeClip">
          <rect width="32" height="32" rx="7.5" />
        </clipPath>
      </defs>
      <rect width="32" height="32" rx="7.5" fill="url(#hotelynkLogoGrad)" />
      <g clipPath="url(#hotelynkBadgeClip)">
        <rect x="0" y="0" width="32" height="15" fill="url(#hotelynkGlassHi)" />
      </g>
      <rect x="7" y="6" width="5.5" height="20" rx="2.75" fill="#F8F9FC" />
      <rect x="19.5" y="6" width="5.5" height="20" rx="2.75" fill="#F8F9FC" />
      <line
        x1="10"
        y1="20"
        x2="22"
        y2="12"
        stroke="#F8F9FC"
        strokeWidth="5.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
