export const LogoMark = ({ className = "h-10 w-10" }) => (
  <svg
    viewBox="0 0 48 48"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="São José Material de Construção"
  >
    <rect width="48" height="48" rx="11" fill="#EA580C" />
    <rect x="1.25" y="1.25" width="45.5" height="45.5" rx="9.75" fill="none" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="1.5" />
    <path
      d="M8.5 21.5 L24 9 L39.5 21.5"
      fill="none"
      stroke="#FACC15"
      strokeWidth="3.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <text
      x="24"
      y="37.5"
      textAnchor="middle"
      fontFamily="Outfit, ui-sans-serif, system-ui, sans-serif"
      fontWeight="800"
      fontSize="19"
      letterSpacing="0.5"
      fill="#ffffff"
    >
      SJ
    </text>
  </svg>
);

export default LogoMark;
