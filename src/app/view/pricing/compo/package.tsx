export interface PackageProps {
  packageName: string;
  activeSince: string; // ISO or human-readable date string
  credits: number;
  features: ReadonlyArray<string>;
  available: boolean;
}

export default function Package(props: PackageProps) {
  const { packageName, activeSince, credits, features, available } = props;

  return (
    <div
      className="package text-gray-900 dark:text-white rounded-2xl border border-gray-200 dark:border-white/10 bg-white/90 dark:bg-gradient-to-br dark:from-white/10 dark:via-white/5 dark:to-transparent backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_0_1px_#fff_inset,0_10px_30px_rgba(0,0,0,0.4)] p-6"
    >
      <div className="flex items-start justify-between">
        <div>
          <h4 className="package-name text-lg font-semibold">{packageName}</h4>
          <p className="text-xs text-gray-600 dark:text-white/70 mt-1">Active Since : {activeSince}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold leading-none">{credits}</div>
          <div className="text-xs text-gray-600 dark:text-white/70 mt-1">Credits</div>
        </div>
      </div>

      {features?.length ? (
        <div className="features mt-6 space-y-1 text-sm text-gray-700 dark:text-white/80">
          {features.map((feature, idx) => (
            <p key={idx}>{feature}</p>
          ))}
        </div>
      ) : null}

      <div className="mt-6 flex justify-end">
        <button
          className="package-btn bg-blue-600 hover:bg-blue-700 dark:bg-[#153042] dark:hover:bg-[#1c3c52] text-white rounded-full px-5 py-2 text-xs disabled:opacity-60"
          disabled={!available}
        >
          {available ? "Change Plan" : "Unavailable"}
        </button>
      </div>
    </div>
  );
}


