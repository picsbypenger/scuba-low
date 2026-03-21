const GolfBall = ({ size = 24, className = "" }: { size?: number, className?: string }) => {
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
      <circle cx="12" cy="12" r="10" />
      {/* Dimples as simple dots */}
      <circle cx="8.5" cy="8.5" r="0.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="7" r="0.5" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="8.5" r="0.5" fill="currentColor" stroke="none" />
      <circle cx="7" cy="12" r="0.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="11.5" r="0.5" fill="currentColor" stroke="none" />
      <circle cx="17" cy="12" r="0.5" fill="currentColor" stroke="none" />
      <circle cx="8.5" cy="15.5" r="0.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="17" r="0.5" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="15.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
};

export default GolfBall;
