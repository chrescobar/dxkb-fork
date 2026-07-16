"use client";

import Image from "next/image";
import { useState } from "react";

// CEPI images live on an external host and occasionally 404 (e.g. sizes not
// generated for PNG sources). Fall back to the CEPI logo so cards never show a
// broken image.
const fallbackSrc = "/images/websites/cepi.png";

export const NewsCardImage = ({ src, alt }: { src: string; alt: string }) => {
  const [imageSrc, setImageSrc] = useState(src || fallbackSrc);

  return (
    <Image
      src={imageSrc}
      alt={alt}
      fill
      className="object-cover"
      onError={() => { setImageSrc(fallbackSrc); }}
    />
  );
};
