import { useState } from 'react';

/** A small fork-and-plate glyph — the fallback shown when there's no photo or it fails to load. */
function PlateGlyph({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="7.5" stroke="#1C1B19" strokeOpacity="0.25" strokeWidth="1.4" />
      <circle cx="12" cy="12" r="3.2" stroke="#1C1B19" strokeOpacity="0.25" strokeWidth="1.4" />
    </svg>
  );
}

export function RestaurantThumb({
  src,
  alt,
  size = 64,
  className = '',
}: {
  src?: string;
  alt: string;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = src && !failed;

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-ticket bg-paper-dark ${className}`}
      style={{ width: size, height: size }}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <PlateGlyph size={Math.round(size * 0.4)} />
      )}
    </div>
  );
}
