import { cn } from "cn";

export function SliceFrame({
  src,
  imageWidth,
  imageHeight,
  sx,
  sy,
  sw,
  sh,
  alt,
  className,
  blobUrl,
}: {
  src: string;
  imageWidth: number;
  imageHeight: number;
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  alt: string;
  className?: string;
  blobUrl?: string;
}) {
  if (blobUrl) {
    return (
      // The box already matches the slice aspect ratio, so fill shows the export 1:1.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={blobUrl}
        alt={alt}
        draggable={false}
        className={cn("h-full w-full object-fill", className)}
      />
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Crop of the original, positioned in pixel space so remainder columns stay exact. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        draggable={false}
        className="absolute max-w-none select-none"
        style={{
          width: `${(imageWidth / sw) * 100}%`,
          height: `${(imageHeight / sh) * 100}%`,
          left: `${(-sx / sw) * 100}%`,
          top: `${(-sy / sh) * 100}%`,
        }}
      />
    </div>
  );
}
