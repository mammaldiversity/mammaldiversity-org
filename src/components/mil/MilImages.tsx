import { useState } from "preact/hooks";
import type { MilMetadata } from "../../../db/mil_model";

export default function MilImages({ metadata }: { metadata: MilMetadata[] }) {
  const [current, setCurrent] = useState(0);
  const [imgError, setImgError] = useState(false);
  const image = metadata[current];
  const isFirst = current === 0;
  const isLast = current === metadata.length - 1;

  const handlePrev = () => {
    setCurrent((c) => c - 1);
    setImgError(false);
  };
  const handleNext = () => {
    setCurrent((c) => c + 1);
    setImgError(false);
  };

  return (
    <div className="mil-images bg-gradient-to-r from-spectra-100 to-spicy-mix-100 dark:from-spectra-900 dark:to-spicy-mix-900 rounded-xl pb-2 mt-2">
      {!image ? (
        <p className="text-gray-500 p-4">No images available</p>
      ) : (
        <>
          {/* Image container */}
          <div className="relative w-full">
            {imgError ? (
              <div className="w-full flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 text-sm py-10">
                No image available
              </div>
            ) : (
              <div className="w-full max-h-[400px] bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                <img
                  src={image.filePath}
                  alt={image.description}
                  title={image.description}
                  className="w-full h-full max-h-[400px] object-contain"
                  onError={() => setImgError(true)}
                />
              </div>
            )}

            {/* Prev button */}
            <button
              onClick={handlePrev}
              disabled={isFirst}
              aria-label="Previous image"
              className={`
                absolute left-2 top-1/2 -translate-y-1/2
                bg-black/50 hover:bg-black/75 text-white
                rounded-full w-10 h-10 flex items-center justify-center
                transition-opacity
                ${
                  isFirst
                    ? "opacity-30 cursor-not-allowed"
                    : "opacity-100 cursor-pointer"
                }
              `}
            >
              ‹
            </button>

            {/* Next button */}
            <button
              onClick={handleNext}
              disabled={isLast}
              aria-label="Next image"
              className={`
                absolute right-2 top-1/2 -translate-y-1/2
                bg-black/50 hover:bg-black/75 text-white
                rounded-full w-10 h-10 flex items-center justify-center
                transition-opacity
                ${
                  isLast
                    ? "opacity-30 cursor-not-allowed"
                    : "opacity-100 cursor-pointer"
                }
              `}
            >
              ›
            </button>

            {/* Counter badge */}
            <span className="absolute bottom-2 right-3 bg-black/50 text-white text-sm px-2 py-0.5 rounded-full">
              {current + 1} / {metadata.length}
            </span>
          </div>

          {/* Caption */}
          <div className="mt-2 ml-4 mr-2 text-spectra-800 dark:text-spectra-100 text-sm">
            <div className="grid grid-cols-[auto_1fr] gap-x-2">
              {image.location && (
                <>
                  <span>Location</span>
                  <span>: {image.location}</span>
                </>
              )}
              {image.dateTaken &&
                !isNaN(new Date(image.dateTaken).getTime()) && (
                  <>
                    <span>Date taken</span>
                    <span>
                      :{" "}
                      {new Date(image.dateTaken).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </>
                )}
            </div>
            <p>
              Image courtesy of the{" "}
              <a
                href="https://www.mammalsociety.org/image-library"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-spectra-600 dark:hover:text-spectra-300"
              >
                ASM Mammal Images Library
              </a>{" "}
              &middot; MIL ID: {image.milId}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
