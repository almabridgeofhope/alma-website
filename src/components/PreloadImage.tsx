import { useEffect } from "react";

/**
 * PreloadImage - Komponente zum Preloading von kritischen Bildern
 * Verwendet für Hero-Bilder, die sofort geladen werden müssen
 */
interface PreloadImageProps {
  src: string;
}

export const PreloadImage = ({ src }: PreloadImageProps) => {
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      link.fetchPriority = 'high';
      
      // Prüfe ob bereits ein Preload-Link existiert
      const existingLink = document.head.querySelector(`link[href="${src}"]`);
      if (!existingLink) {
        document.head.appendChild(link);
      }
    }
  }, [src]);

  return null; // Diese Komponente rendert nichts
};

export default PreloadImage;

