import Image from "next/image";
import Link from "next/link";

export default function CreatorNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F5F5] px-4 py-10 text-[#2B2B2B]">
      <div className="w-full max-w-md rounded-[20px] bg-white px-6 py-10 text-center shadow-[0_8px_30px_rgba(43,43,43,0.07)]">
        <Image
          src="/logo.png"
          alt="House Of Creator logo"
          width={80}
          height={80}
          className="mx-auto h-20 w-20 object-contain"
        />
        <h1 className="mt-5 font-display text-2xl font-bold leading-tight">
          This creator isn&apos;t part of the competition
        </h1>
        <Link
          href="/"
          className="mt-7 flex min-h-12 w-full items-center justify-center rounded-full bg-[#73D75C] px-5 font-display text-sm font-bold text-[#173512] transition hover:bg-[#60C449] active:scale-[0.99]"
        >
          See all creators
        </Link>
      </div>
    </main>
  );
}
