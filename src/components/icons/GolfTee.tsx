const GolfTee = ({ size = 24, className = "" }: { size?: number, className?: string }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      {/* Shaft */}
      <path d="M12 21L12 7" />
      {/* Top Cup */}
      <path d="M7 5C7 5 8 8 12 8C16 8 17 5 17 5" />
      <path d="M7 5L17 5" />
      {/* Minimalistic ball hint sitting on top */}
      <circle cx="12" cy="3" r="1.5" stroke="none" fill="currentColor" />
    </svg>
  );
};

export default GolfTee;
