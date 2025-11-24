import LoadingSpinner from '@/components/LoadingSpinner';

export default function Loading() {
	// Global fallback loading UI for route segments without their own loading.tsx
	// Using lightweight CSS spinner instead of 604.6 KiB Logo.gif
	return (
		<div className="w-full h-full min-h-[50vh] flex items-center justify-center">
			<div className="flex flex-col items-center gap-3 text-white/80">
				<LoadingSpinner size={56} className="text-white/80" />
				<div className="text-sm">Loading…</div>
			</div>
		</div>
	);
}

