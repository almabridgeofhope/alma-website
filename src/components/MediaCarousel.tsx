import { useState, useEffect } from "react";
import { MediaItem, PhotoGallery as PhotoGalleryType } from "@/data/newsArticles";
import { Play, X, ZoomIn, Video, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface MediaCarouselProps {
  gallery: PhotoGalleryType;
  className?: string;
}

const MediaCarousel = ({ gallery, className }: MediaCarouselProps) => {
  const { t } = useLanguage();
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

  // Check if this is video 1 (soakPitVideo1) - contains "1.mp4" in the path
  const isVideo1 = (media: MediaItem) => 
    media.type === "video" && media.src && (media.src.includes("/1.mp4") || media.src.includes("1.mp4"));

  return (
      <div className={cn("w-full", className)}>
        <Carousel
          opts={{
            align: "start",
            loop: true,
            dragFree: true,
            containScroll: "trimSnaps",
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {gallery.media.map((media, index) => (
              <CarouselItem key={index} className="pl-2 md:pl-4 basis-auto flex-shrink-0">
                <div className="p-1 h-[400px] md:h-[500px]">
                  <div
                    className="relative group cursor-pointer overflow-hidden rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 h-full w-auto flex items-center justify-center"
                    onClick={() => handleMediaClick(media, index)}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {media.type === "image" ? (
                      <img
                        src={media.src}
                        alt={media.alt || media.caption || `${t("images.gallery.image")} ${index + 1}`}
                        className="h-full w-auto object-contain group-hover:scale-105 transition-transform duration-300 rounded-md"
                        style={{ maxWidth: 'none', height: '100%' }}
                        loading="lazy"
                      />
                    ) : (
                      media.src ? (
                        <video
                          src={media.src}
                          className={cn(
                            "h-full w-auto rounded-md",
                            isVideo1(media) ? "object-contain" : "object-contain"
                          )}
                          style={{ maxWidth: 'none', height: '100%' }}
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
                        "absolute bottom-0 left-0 right-0 flex flex-col p-2 md:p-3",
                        "transform transition-all duration-300",
                        hoveredIndex === index ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                      )}
                    >
                      {/* Video/Image Indicator */}
                      {media.type === "video" && (
                        <div className="mb-1 flex items-center gap-1 text-white/90">
                          <Video className="w-3 h-3" />
                          <span className="text-[10px] font-medium uppercase tracking-wider">Video</span>
                        </div>
                      )}

                      {/* Caption */}
                      {media.caption && (
                        <p className="text-white text-xs md:text-sm font-medium leading-tight drop-shadow-lg line-clamp-2">
                          {media.caption}
                        </p>
                      )}
                    </div>

                    {/* Zoom Icon */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="bg-white/20 backdrop-blur-sm rounded-full p-1.5 group-hover:bg-white/30 transition-colors">
                        <ZoomIn className="w-4 h-4 text-white" />
                      </div>
                    </div>

                    {/* Play Button for Videos */}
                    {media.type === "video" && media.src && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 md:p-3 group-hover:scale-110 transition-transform duration-300">
                          <Play className="w-5 h-5 md:w-6 md:h-6 text-gray-900 fill-current ml-0.5" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>

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
              className="w-full h-full flex items-center justify-center relative scale-95 animate-[zoomIn_0.3s_ease-out_forwards]"
              onClick={(e) => e.stopPropagation()}
            >
              {selectedMedia.type === "image" ? (
                <img
                  src={selectedMedia.src}
                  alt={selectedMedia.alt || selectedMedia.caption || t("images.gallery.image")}
                  className="max-w-[95vw] max-h-[90vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
                  style={{ aspectRatio: 'auto' }}
                  key={selectedIndex}
                />
              ) : (
                selectedMedia.src ? (
                  <video
                    src={selectedMedia.src}
                    controls
                    autoPlay
                    className="max-w-[95vw] max-h-[90vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
                    style={{ aspectRatio: 'auto' }}
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
};

export default MediaCarousel;

