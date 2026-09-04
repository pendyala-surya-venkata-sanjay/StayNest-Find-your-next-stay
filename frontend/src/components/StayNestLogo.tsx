import React from "react";

interface StayNestLogoProps extends React.SVGProps<SVGSVGElement> {
  variant?: "full" | "mark";
  size?: number;
}

export const StayNestLogo: React.FC<StayNestLogoProps> = ({
  variant = "full",
  size = 26,
  className = "",
  ...props
}) => {
  const symbol = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: size, height: size }}
      className={`shrink-0 ${className}`}
      {...props}
    >
      {/* Globe: Outer circle */}
      <circle cx="12" cy="15.5" r="7.5" stroke="#1E3F20" strokeWidth="2" />
      
      {/* Globe latitude line */}
      <path d="M4.7 15.5h14.6" stroke="#1E3F20" strokeWidth="1.2" opacity="0.4" />
      
      {/* Globe longitude/meridian curves */}
      <path d="M12 8a11.5 11.5 0 0 1 2.5 7.5 11.5 11.5 0 0 1-2.5 7.5 11.5 11.5 0 0 1-2.5-7.5 11.5 11.5 0 0 1 2.5-7.5z" stroke="#1E3F20" strokeWidth="1.2" opacity="0.3" />

      {/* House sitting on top of the globe */}
      {/* House Body (Warm Amber #D97706) */}
      <path
        d="M9.5 8V5.5a0.5 0 0 1 .5-.5h4a0.5 0 0 1 .5.5V8"
        fill="#D97706"
        stroke="#D97706"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      {/* House Roof (Warm Amber #D97706) */}
      <path
        d="M8.5 5.5l3.5-3 3.5 3"
        stroke="#D97706"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* House door (Ivory Cream #FAF9F6) */}
      <path
        d="M11 8V6.5h2V8"
        stroke="#FAF9F6"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  if (variant === "mark") {
    return symbol;
  }

  return (
    <div className="flex items-center gap-2.5">
      {symbol}
      <span className="font-serif tracking-wide font-extrabold text-brand text-xl">
        StayNest
      </span>
    </div>
  );
};

export default StayNestLogo;
