export const LogoMark = ({ className = "h-10 w-10" }) => (
  <svg
    viewBox="0 0 48 48"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="TÔ APROVADO Concursos Públicos"
  >
    <defs>
      <linearGradient id="ta-bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#0f9d63" />
        <stop offset="1" stopColor="#046a4b" />
      </linearGradient>
      <linearGradient id="ta-check" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#FDE047" />
        <stop offset="1" stopColor="#F59E0B" />
      </linearGradient>
    </defs>

    {/* badge */}
    <rect width="48" height="48" rx="12" fill="url(#ta-bg)" />
    {/* top highlight */}
    <rect x="0" y="0" width="48" height="20" rx="12" fill="#ffffff" opacity="0.08" />
    {/* seal ring */}
    <circle cx="24" cy="24" r="15.5" fill="none" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="1.4" strokeDasharray="2.5 3" />

    {/* check shadow for depth */}
    <path
      d="M14.5 25 L21.2 31.6 L34 16.8"
      fill="none"
      stroke="#04432f"
      strokeOpacity="0.35"
      strokeWidth="5.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      transform="translate(0.6 0.8)"
    />
    {/* gold check */}
    <path
      d="M14.5 25 L21.2 31.6 L34 16.8"
      fill="none"
      stroke="url(#ta-check)"
      strokeWidth="4.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default LogoMark;
