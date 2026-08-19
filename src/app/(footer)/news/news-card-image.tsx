"use client";

import Image from "next/image";
import { useState } from "react";

// CEPI images live on an external host and occasionally 404 (e.g. sizes not
// generated for PNG sources). Fall back to the CEPI logo so cards never show a
// broken image.
const fallbackSrc = "/images/websites/cepi.png";

export const NewsCardImage = ({ src, alt }: { src: string; alt: string }) => {
  const [hasError, setHasError] = useState(false);
  // Track the current src so a changing `src` (e.g. filtered/re-fetched list)
  // resets the error flag during render — React's recommended pattern over an
  // effect. See https://react.dev/reference/react/useState#storing-information-from-previous-renders
  const [prevSrc, setPrevSrc] = useState(src);
  if (src !== prevSrc) {
    setPrevSrc(src);
    setHasError(false);
  }

  const imageSrc = hasError || !src ? fallbackSrc : src;

  return (
    <Image
      src={imageSrc}
      alt={alt}
      fill
      className="object-cover"
      onError={() => { setHasError(true); }}
    />
  );
};
