const CrossedClubs = ({ size = 24, className = "" }: { size?: number, className?: string }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      {/* Club 1 (Going from bottom-left to top-right) */}
      <path d="M6 19L18 5" /> {/* Shaft */}
      <path d="M18 5L19 4" /> {/* Grip end */}
      <path d="M5 18L4 20C3.8 20.5 4.2 21 4.7 21L7.5 21C8.2 21 8.5 20.5 8.2 20L6 19" /> {/* Angled iron head */}
      
      {/* Club 2 (Going from bottom-right to top-left) */}
      <path d="M18 19L6 5" /> {/* Shaft */}
      <path d="M6 5L5 4" /> {/* Grip end */}
      <path d="M19 18L20 20C20.2 20.5 19.8 21 19.3 21L16.5 21C15.8 21 15.5 20.5 15.8 20L18 19" /> {/* Angled iron head */}
    </svg>
  );
};

export default CrossedClubs;
