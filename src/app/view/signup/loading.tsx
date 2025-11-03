export default function Loading() {
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-[#07070B]">
      <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-[#0f1115]/90 border border-white/10 shadow-2xl">
        <div className="h-12 w-12 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        <div className="text-center">
          <p className="text-white text-base md:text-lg font-medium">Preparing sign-in…</p>
          <p className="text-white/70 text-xs md:text-sm mt-1">Just a moment</p>
        </div>
      </div>
    </main>
  )
}
