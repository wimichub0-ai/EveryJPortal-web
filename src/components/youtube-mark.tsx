type YouTubeMarkProps = {
  className?: string;
};

export function YouTubeMark({ className = "h-4 w-5" }: YouTubeMarkProps) {
  return (
    <span
      className={`relative inline-block shrink-0 rounded-[4px] bg-[#FF0000] ${className}`}
      aria-hidden="true"
    >
      <span className="absolute left-1/2 top-1/2 h-0 w-0 -translate-x-[40%] -translate-y-1/2 border-y-[4px] border-l-[6px] border-y-transparent border-l-white" />
    </span>
  );
}
