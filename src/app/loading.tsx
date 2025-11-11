export default function Loading() {
	// Global fallback loading UI for route segments without their own loading.tsx
	return (
		<div className="w-full h-full min-h-[50vh] flex items-center justify-center">
			<div className="flex flex-col items-center gap-3 text-white/80">
				<img src="/styles/Logo.gif" alt="Loading" width={56} height={56} />
				<div className="text-sm">Loading…</div>
			</div>
		</div>
	);
}

