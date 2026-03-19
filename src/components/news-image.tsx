/* eslint-disable @next/next/no-img-element */

type NewsImageProps = {
  src?: string | null;
  alt: string;
  fallbackText?: string;
  className?: string;
};

function normalizeImageSource(src?: string | null): string | null {
  if (!src) {
    return null;
  }

  const trimmed = src.trim();

  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return null;
  }

  return trimmed;
}

export function NewsImage({
  src,
  alt,
  fallbackText = "Ảnh minh họa",
  className = "",
}: NewsImageProps) {
  const imageSource = normalizeImageSource(src);

  return (
    <div className={`relative overflow-hidden rounded-xl bg-slate-200 ${className}`}>
      {imageSource ? (
        <img
          src={imageSource}
          alt={alt}
          loading="lazy"
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 p-4 text-center text-sm font-semibold text-slate-500">
          {fallbackText}
        </div>
      )}
    </div>
  );
}
