import Image from "next/image";
import Link from "next/link";

export default function CreatorNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F5F5] px-4 py-10 text-[#2B2B2B]">
      <div className="w-full max-w-md rounded-[20px] bg-white px-6 py-10 text-center shadow-[0_8px_30px_rgba(43,43,43,0.07)]">
        <Image
          src="/logo.png"
          alt="Everything Jos logo"
          width={52}
          height={52}
          className="mx-auto h-[52px] w-[52px] rounded-full object-cover"
        />
        <h1 className="mt-5 font-display text-2xl font-bold leading-tight">
          This creator isn&apos;t part of the competition
        </h1>
        <Link
          href="/"
          className="mt-7 flex min-h-12 w-full items-center justify-center rounded-full bg-[#F2A93B] px-5 font-display text-sm font-bold text-white transition hover:bg-[#E99C29] active:scale-[0.99]"
        >
          See all creators
        </Link>
      </div>
    </main>
  );
}
