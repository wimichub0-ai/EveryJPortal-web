export default function Loading() {
  return (
    <main className="min-h-screen bg-[#F5F5F5] px-4 py-10">
      <div className="mx-auto w-full max-w-md animate-pulse space-y-8">
        <div className="mx-auto h-8 w-52 rounded-full bg-black/10" />
        <div className="mx-auto h-4 w-80 max-w-full rounded-full bg-black/10" />
        <div className="h-48 rounded-[20px] bg-white" />
        {[1, 2].map((item) => (
          <div key={item} className="h-[620px] rounded-[20px] bg-white" />
        ))}
      </div>
    </main>
  );
}
