const URL = "https://www.mammalsociety.org/image-library";

export function MilAttribution() {
  return (
    <p className="text-xs mt-2">
      Image courtesy of the{" "}
      <a
        href={URL}
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-spectra-600 dark:hover:text-spectra-300"
      >
        ASM Mammal Images Library
      </a>
    </p>
  );
}

export function MilAttributionByMddId({ milId }: { milId: number }) {
  return (
    <p className="text-xs mt-2">
      Image courtesy of the{" "}
      <a
        href={URL}
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-spectra-600 dark:hover:text-spectra-300"
      >
        ASM Mammal Images Library
      </a>{" "}
      &middot; MIL ID: {milId}
    </p>
  );
}
