import Image from "next/image";
import {
  InstagramIcon,
  TikTokIcon,
  YouTubeIcon,
} from "@/components/social-icons";
import { EVERYTHING_JOS_SOCIAL_LINKS } from "@/lib/site-constants";

const socialIcons = {
  Instagram: InstagramIcon,
  TikTok: TikTokIcon,
  YouTube: YouTubeIcon,
} as const;

export function Footer() {
  return (
    <footer className="mx-auto w-full max-w-md border-t border-[#2B2B2B]/10 px-2 pb-6 pt-10 text-center">
      <div className="flex items-center justify-center gap-3 text-left">
        <Image
          src="/logo.png"
          alt="Everything Jos logo"
          width={48}
          height={48}
          className="h-12 w-12 shrink-0 rounded-full object-cover"
        />
        <div>
          <h2 className="font-display text-lg font-bold leading-tight text-[#2B2B2B]">
            Everything jos
          </h2>
          <p className="mt-1 text-xs leading-4 text-[#777]">
            Redefining perception. Amplifying jos
          </p>
        </div>
      </div>

      <nav className="mt-6 flex items-center justify-center gap-2" aria-label="Everything Jos social links">
        {EVERYTHING_JOS_SOCIAL_LINKS.map(({ platform, href, ariaLabel }) => {
          const Icon = socialIcons[platform];
          return (
          <a
            key={platform}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={ariaLabel}
            className="flex h-11 w-11 items-center justify-center rounded-full text-[#2B2B2B] transition hover:bg-black/5 hover:text-[#D98912] active:scale-95"
          >
            <Icon />
          </a>
          );
        })}
      </nav>

      <div className="mt-9 flex items-center justify-center gap-2 text-[11px] text-[#8A8A8A]">
        <span>Powered by</span>
        <Image
          src="/opralo.svg"
          alt="Opralo"
          width={72}
          height={20}
          className="h-5 w-auto opacity-65 grayscale"
        />
      </div>
    </footer>
  );
}
