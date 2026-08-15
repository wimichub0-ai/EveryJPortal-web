import { YouTubeMark } from "@/components/youtube-mark";

type YouTubeButtonProps = {
  href: string;
};

export function YouTubeButton({ href }: YouTubeButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-[#2B2B2B]/25 bg-white px-5 font-display text-sm font-semibold text-[#2B2B2B] transition hover:border-[#2B2B2B] hover:bg-[#FAFAFA] active:scale-[0.99]"
    >
      <YouTubeMark className="h-4 w-6" />
      Subscribe on YouTube
    </a>
  );
}
