import React, {useEffect, useState} from 'react';
import {Footprints} from 'lucide-react';

interface ResilientImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
  priority?: boolean;
}

export const ResilientImage: React.FC<ResilientImageProps> = ({
  src,
  alt,
  className = 'w-full h-full object-cover',
  fallbackLabel,
  priority = false,
}) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return (
      <div
        role="img"
        aria-label={alt}
        className="w-full h-full bg-[#E6E5E3] flex flex-col items-center justify-center p-4 text-[#3C4044]/70 select-none"
      >
        <Footprints className="w-8 h-8 mb-2 stroke-[1.5]" />
        <span className="text-xs font-medium text-center line-clamp-2 max-w-[18ch]">
          {fallbackLabel || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : 'auto'}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
};
