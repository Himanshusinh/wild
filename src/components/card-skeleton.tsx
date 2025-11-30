import { Skeleton } from "./skeleton";



export const ContentCardSkeleton: React.FC<{ aspectRatio?: string }> = ({ aspectRatio = '1/1' }) => {

  return (

    <div className="relative w-full overflow-visible bg-transparent group">
      <div className="relative w-full overflow-hidden bg-gray-900/20 flex items-center justify-center" style={{ aspectRatio: aspectRatio }}>
        <Skeleton className="w-full h-full" />
      </div>
    </div>

  );

};



export const ContentCardSkeletonList: React.FC = () => {

  // Match the same fallback ratios used in ArtStation to create variety in skeleton orientations
  const fallbackRatios = ['1/1', '4/3', '3/4', '16/9', '9/16', '3/2', '2/3','1/2','2/1','1/3','3/1','1/4','4/1','1/5','5/1','1/6','6/1','1/7','7/1','1/8','8/1','1/9','9/1','1/10','10/1'];

  return (

    <div className="w-full columns-1 md:columns-2 lg:columns-3 2xl:columns-4 gap-2">

      {Array.from({ length: 8 }).map((_, i) => {

        // Cycle through ratios to match image variety and orientations
        const ratio = fallbackRatios[i % fallbackRatios.length];
        
        return (
          // eslint-disable-next-line react/no-array-index-key
          <ContentCardSkeleton key={i} aspectRatio={ratio} />
        );
      })}

    </div>

  );

};

