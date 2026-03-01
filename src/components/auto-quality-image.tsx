"use client";

import Image, { type ImageProps } from "next/image";
import { useMemo, useState } from "react";

type AutoQualityImageProps = Omit<ImageProps, "src"> & {
  src: string;
};

function toOptimizedPath(src: string): string {
  if (!src.startsWith("/")) {
    return src;
  }

  if (src.startsWith("/optimized/")) {
    return src;
  }

  const dotIndex = src.lastIndexOf(".");
  const slashIndex = src.lastIndexOf("/");

  if (dotIndex <= slashIndex) {
    return src;
  }

  const base = src.slice(0, dotIndex);
  return `/optimized${base}.webp`;
}

export function AutoQualityImage({ src, ...props }: AutoQualityImageProps) {
  const optimizedSrc = useMemo(() => toOptimizedPath(src), [src]);
  const [currentSrc, setCurrentSrc] = useState(optimizedSrc);

  return (
    <Image
      {...props}
      src={currentSrc}
      onError={() => {
        if (currentSrc !== src) {
          setCurrentSrc(src);
        }
      }}
    />
  );
}
