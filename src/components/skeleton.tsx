import { cn } from "@/lib/utils";

import React from "react";



export type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {

  return <div className={cn("animate-pulse rounded-md bg-white/10", className)} {...props} />;

};

