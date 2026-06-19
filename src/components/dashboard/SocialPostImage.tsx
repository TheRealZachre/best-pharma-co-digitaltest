"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { getPostImageCandidates } from "@/lib/social/image-url";
import type { Platform } from "@/lib/types";
import { ImageIcon } from "lucide-react";
import clsx from "clsx";

interface SocialPostImageProps {
  imageUrl: string;
  platform?: Platform;
  postId: string;
  alt?: string;
  className?: string;
  containerClassName?: string;
  sizes?: string;
  fit?: "contain" | "cover";
  maxHeightClassName?: string;
}

export function SocialPostImage({
  imageUrl,
  platform,
  postId,
  alt = "Post creative",
  className,
  containerClassName,
  sizes = "(max-width: 768px) 100vw, 300px",
  fit = "contain",
  maxHeightClassName = "max-h-[28rem]",
}: SocialPostImageProps) {
  const candidates = useMemo(
    () => getPostImageCandidates(imageUrl, platform, postId),
    [imageUrl, platform, postId]
  );
  const [candidateIndex, setCandidateIndex] = useState(0);
  const imageSrc = candidates[candidateIndex];
  const showImage = Boolean(imageSrc);

  function handleImageError() {
    setCandidateIndex((current) => {
      if (current + 1 < candidates.length) {
        return current + 1;
      }
      return current;
    });
  }

  if (fit === "contain") {
    return (
      <div
        className={clsx(
          "flex w-full items-center justify-center bg-brand-off-white",
          containerClassName
        )}
      >
        {showImage ? (
          <Image
            src={imageSrc}
            alt={alt}
            width={800}
            height={800}
            unoptimized
            className={clsx(
              "h-auto w-full object-contain",
              maxHeightClassName,
              className
            )}
            sizes={sizes}
            onError={handleImageError}
          />
        ) : (
          <div className="flex min-h-48 w-full flex-col items-center justify-center gap-2 py-10 text-brand-muted/60">
            <ImageIcon className="h-10 w-10" />
            <span className="text-xs">Preview unavailable</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={clsx("relative bg-brand-off-white", containerClassName)}>
      {showImage ? (
        <Image
          src={imageSrc}
          alt={alt}
          fill
          unoptimized
          className={clsx("object-cover", className)}
          sizes={sizes}
          onError={handleImageError}
        />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-brand-muted/60">
          <ImageIcon className="h-10 w-10" />
          <span className="text-xs">Preview unavailable</span>
        </div>
      )}
    </div>
  );
}
