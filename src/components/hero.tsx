import Image from "next/image";

type HeroProps = {
  title: string;
  subtitle: string;
};

export function Hero({ title, subtitle }: HeroProps) {
  return (
    <header className="px-3 text-center">
      <Image
        src="/logo.png"
        alt="Everything Jos logo"
        width={48}
        height={48}
        priority
        className="mx-auto mb-4 h-12 w-12 rounded-full object-cover shadow-sm"
      />
      <h1 className="font-display text-3xl font-bold leading-tight tracking-[-0.03em] text-[#2B2B2B] sm:text-4xl">
        {title}
      </h1>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#737373]">
        {subtitle}
      </p>
    </header>
  );
}
