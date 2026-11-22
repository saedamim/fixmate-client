"use client";

import { useRef, useState } from "react";
import Avatar from "./Avatar";
import { API_URL } from "@/lib/data/services";

export const AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp"];
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024; // the server enforces the same 2 MB limit

// Optional profile picture. The chosen file is uploaded straight away, and the resulting link is shown
// (with a Copy button). The parent gets the link through onChange (null when there is no picture).
export default function AvatarPicker({
  name,
  url,
  onChange,
  onBusyChange,
  disabled,
}: {
  name: string;
  url: string | null;
  onChange: (url: string | null) => void;
  onBusyChange?: (busy: boolean) => void;
  disabled?: boolean;
}) {
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const setBusy = (busy: boolean) => {
    setUploading(busy);
    onBusyChange?.(busy);
  };

  const handleChoose = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // lets the same file be chosen again after removing it
    if (!file) return;
    if (!AVATAR_TYPES.includes(file.type)) return setError("Please choose a PNG, JPG or WebP image.");
    if (file.size > AVATAR_MAX_BYTES) return setError("The image must be 2 MB or smaller.");

    setError("");
    setBusy(true);
    try {
      const body = new FormData();
      body.append("image", file);
      const response = await fetch(`${API_URL}/api/upload/image`, { method: "POST", body });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.imageUrl) {
        setError(result.message || "Could not upload the picture. Please try again.");
        return;
      }
      setCopied(false);
      onChange(result.imageUrl);
    } catch {
      setError("Could not reach the server to upload the picture.");
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setError("Could not copy. Select the link and copy it by hand.");
    }
  };

  return (
    <div>
      <span className="mb-2 block text-sm font-semibold text-gray-800">
        Profile Picture <span className="font-normal text-gray-500">(optional)</span>
      </span>
      <div className="flex items-center gap-4">
        <Avatar name={name || "You"} src={url} size={64} />
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" disabled={disabled || uploading} onClick={() => inputRef.current?.click()} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 disabled:opacity-60">
            {uploading ? "Uploading..." : url ? "Change" : "Choose photo"}
          </button>
          {url && !uploading && (
            <button type="button" disabled={disabled} onClick={() => { setError(""); onChange(null); }} className="px-2 py-2 text-sm font-semibold text-red-600 hover:underline disabled:opacity-60">
              Remove
            </button>
          )}
        </div>
        <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleChoose} className="hidden" />
      </div>

      {url && !uploading && (
        <div className="mt-3 flex items-center gap-2">
          <input readOnly value={url} onFocus={(e) => e.currentTarget.select()} aria-label="Uploaded picture link" className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-xs text-gray-700" />
          <button type="button" onClick={copyLink} className="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-50">
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      )}
      {error && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
}
