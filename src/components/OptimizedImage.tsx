import { ImgHTMLAttributes, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'loading'> {
  src: string;
  alt: string;
  lazy?: boolean;
  priority?: boolean;
  className?: string;
  aspectRatio?: string;
  containerClassName?: string;
}

/**
 * OptimizedImage - Eine optimierte Bildkomponente mit Lazy Loading und Preloading
 * 
 * Features:
 * - Automatisches Lazy Loading für Bilder außerhalb des Viewports
 * - Preloading für kritische Bilder (priority=true)
 * - Responsive Bildunterstützung
 * - Fallback für ältere Browser
 * - Placeholder während des Ladens
 */
export const OptimizedImage = ({
  src,
  alt,
  lazy = true,
  priority = false,
  className,
  aspectRatio,
  containerClassName,
  ...props
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Für kritische Bilder (Hero-Bilder) kein Lazy Loading
  const loading = priority ? "eager" : (lazy ? "lazy" : "eager");
  
  // Preload für kritische Bilder
  useEffect(() => {
    if (priority && typeof document !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      if (!document.head.querySelector(`link[href="${src}"]`)) {
        document.head.appendChild(link);
      }
    }
  }, [priority, src]);

  const imageElement = (
    <img
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      className={cn(
        "transition-opacity duration-300",
        isLoaded ? "opacity-100" : "opacity-0",
        className
      )}
      onLoad={() => setIsLoaded(true)}
      onError={() => {
        setHasError(true);
        setIsLoaded(true);
      }}
      {...props}
    />
  );

  // Wenn aspectRatio angegeben ist, wrappen wir das Bild
  if (aspectRatio) {
    // Konvertiere "4/3" zu Padding-Bottom für Aspect Ratio
    const [width, height] = aspectRatio.split('/').map(Number);
    const paddingBottom = `${(height / width) * 100}%`;
    
    return (
      <div
        className={cn(
          "relative overflow-hidden w-full",
          containerClassName
        )}
        style={{ paddingBottom }}
      >
        {!isLoaded && !hasError && (
          <div className="absolute inset-0 bg-muted animate-pulse" />
        )}
        <div className="absolute inset-0 w-full h-full">
          {imageElement}
        </div>
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
            <span className="text-sm">Bild konnte nicht geladen werden</span>
          </div>
        )}
      </div>
    );
  }

  // Ohne aspectRatio, direktes Bild
  return (
    <div className={cn("relative w-full h-full", containerClassName)}>
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      <div className="absolute inset-0 w-full h-full">
        {imageElement}
      </div>
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
          <span className="text-sm">Bild konnte nicht geladen werden</span>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;

