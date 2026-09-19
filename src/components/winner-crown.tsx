export function WinnerCrown({ className }: { className?: string }) {
  return <svg viewBox="0 0 80 56" className={className} aria-hidden="true" fill="none">
    <path d="M10 15 25 29 40 7 55 29 70 15 63 47H17Z" fill="#73D75C" stroke="#287A1D" strokeWidth="3" strokeLinejoin="round" />
    <path d="M18 43H62V51H18Z" fill="#B9EFA9" stroke="#287A1D" strokeWidth="3" />
    <circle cx="10" cy="12" r="5" fill="#B9EFA9" /><circle cx="40" cy="6" r="5" fill="#B9EFA9" /><circle cx="70" cy="12" r="5" fill="#B9EFA9" />
    <path d="m40 28 5 7-5 7-5-7Z" fill="#F2FBEF" />
  </svg>;
}
