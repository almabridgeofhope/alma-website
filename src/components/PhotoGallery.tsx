import { useState, useEffect } from "react";
import { MediaItem, PhotoGallery as PhotoGalleryType } from "@/data/newsArticles";
import { Play, X, ZoomIn, Video, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhotoGalleryProps {
  gallery: PhotoGalleryType;
  className?: string;
}

const PhotoGallery = ({ gallery, className }: PhotoGalleryProps) => {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const handleMediaClick = (media: MediaItem, index: number) => {
    setSelectedMedia(media);
    setSelectedIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setLightboxOpen(false);
    setSelectedMedia(null);
  };

  const navigateMedia = (direction: "prev" | "next") => {
    const newIndex = direction === "next" 
      ? (selectedIndex + 1) % gallery.media.length
      : (selectedIndex - 1 + gallery.media.length) % gallery.media.length;
    
    setSelectedIndex(newIndex);
    setSelectedMedia(gallery.media[newIndex]);
  };

  // Keyboard navigation and close on Escape
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeLightbox();
      } else if (e.key === "ArrowLeft") {
        navigateMedia("prev");
      } else if (e.key === "ArrowRight") {
        navigateMedia("next");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, selectedIndex, gallery.media]);

  const layout = gallery.layout || "masonry";

  // Calculate optimal column span to minimize gaps
  // Use a more uniform distribution to prevent gaps
  const getItemSize = (index: number, total: number): string => {
    // For 12 items, distribute evenly: mostly 1-column items with occasional 2-column for balance
    if (total === 12) {
      // Items at positions that would create nice patterns
      if (index === 0 || index === 4 || index === 8) {
        return "md:col-span-2";
      }
      return "md:col-span-1";
    }
    
    // For other sizes, use a balanced approach
    if (total <= 3) {
      return "md:col-span-1";
    }
    
    // First item can be larger
    if (index === 0 && total > 4) {
      return "md:col-span-2";
    }
    
    // Every 4th item (after first) spans 2 columns for visual variety
    if ((index - 1) % 4 === 0 && index > 0 && total > 5) {
      return "md:col-span-2";
    }
    
    return "md:col-span-1";
  };

  if (layout === "masonry" || layout === "grid") {
    return (
      <div className={cn("w-full", className)}>
        {/* Modern Masonry Grid with dense packing to prevent gaps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 auto-rows-auto" style={{ gridAutoFlow: 'row dense' }}>
          {gallery.media.map((media, index) => {
            const sizeClass = getItemSize(index, gallery.media.length);
            const isVideo = media.type === "video";
            const isHovered = hoveredIndex === index;

            return (
              <div
                key={index}
                className={cn(
                  "relative group cursor-pointer overflow-hidden rounded-xl",
                  "bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900",
                  "transform transition-all duration-500 ease-out",
                  "hover:scale-[1.02] hover:shadow-2xl hover:z-10",
                  "p-2",
                  "flex items-center justify-center",
                  "min-h-[250px]",
                  sizeClass
                )}
                onClick={() => handleMediaClick(media, index)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Media Content - fills the grey frame completely */}
                {media.type === "image" ? (
                  <img
                    src={media.src}
                    alt={media.alt || `Gallery image ${index + 1}`}
                    className={cn(
                      "w-full h-full object-cover transition-transform duration-700 rounded-lg",
                      isHovered ? "scale-105" : "scale-100"
                    )}
                    loading="lazy"
                  />
                ) : (
                  media.src ? (
                    <video
                      src={media.src}
                      className="w-full h-full object-cover rounded-lg"
                      muted
                      playsInline
                      loop
                      onError={(e) => {
                        const target = e.target as HTMLVideoElement;
                        target.style.display = 'none';
                      }}
                    />
                  ) : null
                )}

                {/* Gradient Overlay */}
                <div
                  className={cn(
                    "absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent",
                    "opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  )}
                />

                {/* Content Overlay */}
                <div
                  className={cn(
                    "absolute bottom-0 left-0 right-0 flex flex-col p-4 md:p-6",
                    "transform transition-all duration-300",
                    isHovered ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                  )}
                >
                  {/* Video/Image Indicator */}
                  {isVideo && (
                    <div className="mb-2 flex items-center gap-2 text-white/90">
                      <Video className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase tracking-wider">Video</span>
                    </div>
                  )}

                  {/* Caption */}
                  {media.caption && (
                    <p className="text-white text-sm md:text-base font-medium leading-relaxed drop-shadow-lg">
                      {media.caption}
                    </p>
                  )}
                </div>

                {/* Zoom Icon */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-2 group-hover:bg-white/30 transition-colors">
                    <ZoomIn className="w-5 h-5 text-white" />
                  </div>
                </div>

                {/* Play Button for Videos */}
                {isVideo && media.src && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-white/90 backdrop-blur-sm rounded-full p-4 md:p-6 group-hover:scale-110 transition-transform duration-300">
                      <Play className="w-8 h-8 md:w-12 md:h-12 text-gray-900 fill-current ml-1" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Modern Lightbox */}
        {lightboxOpen && selectedMedia && (
          <div
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 opacity-0 animate-[fadeIn_0.3s_ease-out_forwards]"
            onClick={closeLightbox}
          >
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-6 right-6 z-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full p-3 transition-all duration-200 group"
              aria-label="Close"
            >
              <X className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-300" />
            </button>

            {/* Previous Button */}
            {gallery.media.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigateMedia("prev");
                }}
                className="absolute left-6 top-1/2 transform -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full p-4 transition-all duration-200 group"
                aria-label="Previous"
              >
                <ChevronLeft className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
              </button>
            )}

            {/* Next Button */}
            {gallery.media.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigateMedia("next");
                }}
                className="absolute right-6 top-1/2 transform -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full p-4 transition-all duration-200 group"
                aria-label="Next"
              >
                <ChevronRight className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
              </button>
            )}

            {/* Media Container */}
            <div
              className="max-w-7xl w-full max-h-[90vh] flex items-center justify-center relative scale-95 animate-[zoomIn_0.3s_ease-out_forwards]"
              onClick={(e) => e.stopPropagation()}
            >
              {selectedMedia.type === "image" ? (
                <img
                  src={selectedMedia.src}
                  alt={selectedMedia.alt || "Gallery image"}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                  key={selectedIndex}
                />
              ) : (
                selectedMedia.src ? (
                  <video
                    src={selectedMedia.src}
                    controls
                    autoPlay
                    className="max-w-full max-h-full rounded-lg shadow-2xl"
                    key={selectedIndex}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="text-white text-center p-8">
                    <p className="text-lg">Video wird geladen...</p>
                  </div>
                )
              )}

              {/* Caption in Lightbox */}
              {selectedMedia.caption && (
                <div
                  className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-md text-white px-6 py-3 rounded-lg max-w-2xl translate-y-4 animate-[slideUp_0.4s_ease-out_0.1s_forwards] opacity-0"
                >
                  <p className="text-sm md:text-base text-center">{selectedMedia.caption}</p>
                </div>
              )}
            </div>

            {/* Navigation Info */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-white/60 text-xs text-center">
              <div>Drücke ESC zum Schließen</div>
              {gallery.media.length > 1 && (
                <div className="mt-1">
                  {selectedIndex + 1} / {gallery.media.length} • Pfeiltasten zum Navigieren
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Carousel layout (fallback)
  return (
    <div className={cn("w-full", className)}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {gallery.media.map((media, index) => (
          <div
            key={index}
            className="relative overflow-hidden rounded-xl cursor-pointer group"
            onClick={() => handleMediaClick(media, index)}
          >
            <div className="relative aspect-video bg-muted">
              {media.type === "image" ? (
                <img
                  src={media.src}
                  alt={media.alt || `Gallery image ${index + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                media.src ? (
                  <video
                    src={media.src}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                  />
                ) : null
              )}
            </div>
            {media.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <p className="text-white text-sm">{media.caption}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PhotoGallery;

