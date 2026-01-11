'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';
import { Badge } from './badge';

interface ImageCarouselProps {
  images: string[];
  alt?: string;
  mainImageIndex?: number;
  showMainBadge?: boolean;
}

export function ImageCarousel({
  images,
  alt = 'Product image',
  mainImageIndex = 0,
  showMainBadge = true,
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(mainImageIndex);

  if (!images || images.length === 0) return null;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleThumbnailClick = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className="space-y-4">
      {/* Main image area */}
      <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 hover:bg-background z-10 shadow-md"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-5 w-5 text-primary" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 hover:bg-background z-10 shadow-md"
              onClick={goToNext}
            >
              <ChevronRight className="h-5 w-5 text-primary" />
            </Button>
          </>
        )}

        {/* Main image */}
        <img
          src={images[currentIndex]}
          alt={`${alt} ${currentIndex + 1}`}
          className="w-full h-full object-contain"
        />

        {/* Main image badge */}
        {showMainBadge && currentIndex === mainImageIndex && (
          <div className="absolute top-4 left-4">
            <Badge variant="default" className="text-xs">
              Main
            </Badge>
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => handleThumbnailClick(index)}
              className={`shrink-0 relative rounded-lg overflow-hidden transition-all ${
                index === currentIndex ? 'ring-2 ring-primary' : 'opacity-60 hover:opacity-100'
              }`}
            >
              <img src={image} alt={`Thumbnail ${index + 1}`} className="h-20 w-20 object-cover" />
              {index === mainImageIndex && showMainBadge && (
                <div className="absolute bottom-1 left-1">
                  <Badge variant="secondary" className="text-[10px] px-1 py-0">
                    Main
                  </Badge>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
