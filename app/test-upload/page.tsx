
"use client";

import { useState } from "react";
import { API_URL } from "@/lib/data/services";

export default function TestUploadPage() {
  const [image, setImage] = useState<File | null>(null);
  const [result, setResult] = useState("");

  const handleUpload = async () => {
    if (!image) {
      setResult("Please select an image");
      return;
    }

    const formData = new FormData();
    formData.append("image", image);

    try {
      const response = await fetch(
        `${API_URL}/api/upload/image`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Upload failed");
      }

      setResult(data.imageUrl);
    } catch (error) {
      setResult(
        error instanceof Error ? error.message : "Upload failed"
      );
    }
  };

  return (
    <main className="mx-auto max-w-md space-y-4 p-10">
      <h1 className="text-2xl font-bold">Test Image Upload</h1>

      <input
        type="file"
        accept="image/png,image/jpeg"
        onChange={(e) => setImage(e.target.files?.[0] || null)}
      />

      <p>Selected: {image?.name || "No image selected"}</p>

      <button
        onClick={handleUpload}
        className="rounded bg-blue-600 px-5 py-2 text-white"
      >
        Upload Image
      </button>

      <p className="break-all">{result}</p>

      {result.startsWith("http") && (
        <img src={result} alt="Uploaded" className="w-40 rounded-lg" />
      )}
    </main>
  );
}
