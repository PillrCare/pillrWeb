"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Image as ImageIcon } from "lucide-react";

interface ImageViewerProps {
  imageUrl: string;
  alt?: string;
  thumbnailSize?: "sm" | "md" | "lg";
}

export function ImageViewer({ imageUrl, alt = "Event image", thumbnailSize = "md" }: ImageViewerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  };

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    // Prevent body scroll when modal is open
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <>
      {/* Thumbnail Preview */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="relative group cursor-pointer"
        aria-label="View image"
      >
        <div className={`${sizeClasses[thumbnailSize]} rounded-lg border-2 border-input overflow-hidden bg-muted/30 flex items-center justify-center transition-all hover:border-primary hover:shadow-md`}>
          <img
            src={imageUrl}
            alt={alt}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            <ImageIcon className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </button>

      {/* Full-size Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
            aria-hidden
          />

          <Card className="relative w-full max-w-4xl max-h-[90vh] flex flex-col">
            <CardHeader className="relative flex-shrink-0 pb-4">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                aria-label="Close image viewer"
                className="absolute top-4 right-4"
              >
                <X className="h-4 w-4" />
              </Button>
              <CardTitle className="text-xl pr-12">Event Image</CardTitle>
            </CardHeader>

            <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-muted/30">
              <img
                src={imageUrl}
                alt={alt}
                className="max-w-full max-h-[calc(90vh-120px)] object-contain rounded-lg shadow-lg"
              />
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
