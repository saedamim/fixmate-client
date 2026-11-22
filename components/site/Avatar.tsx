// Profile picture, or the user's initials when there is no picture (or it fails to load)
"use client";

import { useState } from "react";

export default function Avatar({ name, src, size = 32 }: { name: string; src?: string | null; size?: number }) {
  const [failed, setFailed] = useState(false);
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "?";
  const style = { width: size, height: size, fontSize: Math.max(11, size * 0.4) };

  if (src && !failed) {
    return (
      // referrerPolicy: Google's picture host rejects some referrers. A plain <img> also needs no image-domain config.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={`${name}'s profile picture`} referrerPolicy="no-referrer" onError={() => setFailed(true)} style={style} className="shrink-0 rounded-full object-cover" />
    );
  }
  return (
    <span style={style} aria-hidden className="inline-flex shrink-0 items-center justify-center rounded-full bg-teal-100 font-semibold text-teal-800">
      {initials}
    </span>
  );
}
