"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Upload, ImageOff } from "lucide-react";
import { useToast, message } from "./ui";
export function PrivateImage({ path, alt }: { path: string; alt: string }) {
  const [url, setUrl] = useState(""),
    [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    setUrl("");
    setFailed(false);
    fetch("/api/uploads?path=" + encodeURIComponent(path))
      .then(async (r) => {
        if (!r.ok) throw Error("Unavailable");
        return r.json();
      })
      .then((d) => {
        if (active) setUrl(d.url);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [path]);
  return (
    <div className="private-image">
      {url ? (
        <Image
          src={url}
          alt={alt}
          width={800}
          height={600}
          unoptimized
          onError={() => setFailed(true)}
        />
      ) : failed ? (
        <span>
          <ImageOff /> Image unavailable
        </span>
      ) : (
        <span className="skeleton">Loading image…</span>
      )}
    </div>
  );
}
export function UploadField({
  label,
  onUploaded,
  disabled = false,
}: {
  label: string;
  onUploaded: (path: string, name: string) => void;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false),
    toast = useToast();
  async function upload(file: File) {
    setBusy(true);
    try {
      if (
        !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
        file.size > 2097152
      )
        throw Error("Choose JPEG, PNG or WebP under 2 MB.");
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/uploads", { method: "POST", body: form }),
        data = await res.json();
      if (!res.ok) throw Error(data.error || "Upload failed.");
      onUploaded(data.path, file.name);
      toast("Image uploaded to your private workspace.");
    } catch (e) {
      toast(message(e), true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <label className={`upload-tile ${disabled || busy ? "disabled" : ""}`}>
      <Upload size={20} />
      <span>{busy ? "Uploading securely…" : label}</span>
      <small>PNG, JPG, WebP · 2 MB maximum</small>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={disabled || busy}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void upload(f);
          e.target.value = "";
        }}
      />
    </label>
  );
}
