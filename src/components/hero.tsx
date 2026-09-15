import { VotingHelpButton } from "@/components/voting-help-button";
import { Reveal } from "@/components/reveal";
import Image from "next/image";

type HeroProps = {
  title: string;
  subtitle: string;
};

export function Hero({ title, subtitle }: HeroProps) {
  return (
    <header className="relative px-3 text-center">
      <VotingHelpButton />
      <Reveal><Image
        src="/logo.png"
        alt="House Of Creator logo"
        width={80}
        height={80}
        priority
        className="mx-auto mb-4 h-20 w-20 object-contain"
      /></Reveal>
      <Reveal delay={0.06}><h1 className="font-display text-3xl font-bold leading-tight tracking-[-0.03em] text-[#2B2B2B] sm:text-4xl">
        {title}
      </h1></Reveal>
      <Reveal delay={0.12}><p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#737373]">
        {subtitle}
      </p></Reveal>
    </header>
  );
}
