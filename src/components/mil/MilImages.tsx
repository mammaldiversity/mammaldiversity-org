import { useState } from "preact/hooks";
import type { MilMetadata } from "../../../db/mil_model";

export default function MilImages({ metadata }: { metadata: MilMetadata[] }) {
  const [current, setCurrent] = useState(0);
  const image = metadata[current];
  const isFirst = current === 0;
  const isLast = current === metadata.length - 1;

  return (
    <div className="mil-images bg-gradient-to-r from-spectra-100 to-spicy-mix-100 dark:from-spectra-900 dark:to-spicy-mix-900 rounded-xl pb-2 mt-2">
      {/* Image container */}
      <div className="relative w-full">
        {/* Show empty state if no images */}
        {!image ? (
          <p className="text-gray-500">No images available</p>
        ) : (
          <img
            src={image.filePath}
            alt={image.description}
            className="w-full object-cover rounded-lg"
          />
        )}
        {/* Prev button */}
        <button
          onClick={() => setCurrent((c) => c - 1)}
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
          onClick={() => setCurrent((c) => c + 1)}
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
        <p>{image.location}</p>
        {image.dateTaken && !isNaN(new Date(image.dateTaken).getTime()) && (
          <>
            &middot; Taken on{" "}
            {new Date(image.dateTaken).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </>
        )}
        <p>
          Courtesy of{" "}
          <a
            href="https://www.mammalogy.org/committees/mammal-images-library"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-spectra-600 dark:hover:text-spectra-300"
          >
            the ASM Mammal Image Library
          </a>{" "}
          &middot; MIL ID: {image.milId}
        </p>
      </div>
    </div>
  );
}
