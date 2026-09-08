import React, { useState } from 'react';
import { School } from 'lucide-react';

interface SchoolLogoProps {
  src?: string;
  alt?: string;
  className?: string;
  containerClassName?: string;
  showFallbackIcon?: boolean;
}

export const SchoolLogo: React.FC<SchoolLogoProps> = ({
  src = '/school_logo.svg',
  alt = 'Logo Sekolah',
  className = 'w-full h-full object-contain',
  containerClassName = '',
  showFallbackIcon = true,
}) => {
  const [hasError, setHasError] = useState(false);

  // If no source provided or failed to load
  if (!src || hasError) {
    if (!showFallbackIcon) return null;
    return (
      <div className={`flex items-center justify-center ${containerClassName}`}>
        <School className="w-5 h-5 text-amber-400" />
      </div>
    );
  }

  return (
    <div className={`relative flex items-center justify-center overflow-hidden ${containerClassName}`}>
      <img
        src={src}
        alt={alt}
        className={className}
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
      />
    </div>
  );
};
