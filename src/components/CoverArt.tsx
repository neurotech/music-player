import { cva, type VariantProps } from "class-variance-authority";
import { Music } from "lucide-react";
import type { ImgHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

const coverArtVariants = cva(
  "flex items-center justify-center overflow-hidden text-zinc-700",
  {
    variants: {
      frame: {
        /** Fills a bordered square parent (e.g. album grid card). */
        fill: "h-full w-full min-h-0 border-0 bg-zinc-900",
        squareSm:
          "h-9 w-9 shrink-0 rounded-sm border border-zinc-700 bg-zinc-800",
        squareMd:
          "h-10 w-10 shrink-0 rounded-sm border border-zinc-800 bg-zinc-900",
        squareLg:
          "h-16 w-16 shrink-0 rounded-sm border border-zinc-800 bg-zinc-900",
        albumHero:
          "h-40 w-40 shrink-0 rounded-sm border border-zinc-800 bg-zinc-900 shadow-lg transition-all group-hover:brightness-75",
        header:
          "h-10 w-10 shrink-0 rounded-sm border border-zinc-700 bg-zinc-800 sm:h-[3.25rem] sm:w-[3.25rem]",
        search:
          "h-10 w-10 shrink-0 rounded-sm border border-zinc-800 bg-zinc-900",
      },
    },
    defaultVariants: {
      frame: "fill",
    },
  },
);

const iconVariants = cva("", {
  variants: {
    frame: {
      fill: "h-8 w-8",
      squareSm: "h-4 w-4",
      squareMd: "h-5 w-5",
      squareLg: "h-8 w-8",
      albumHero: "h-16 w-16",
      header: "h-5 w-5",
      search: "h-5 w-5",
    },
  },
  defaultVariants: {
    frame: "fill",
  },
});

interface CoverArtProps extends VariantProps<typeof coverArtVariants> {
  url?: string | null;
  alt: string;
  className?: string;
  imgClassName?: string;
  /** Passed to img when url is set */
  imgProps?: Omit<
    ImgHTMLAttributes<HTMLImageElement>,
    "src" | "alt" | "className"
  >;
}

export function CoverArt({
  url,
  alt,
  frame,
  className,
  imgClassName,
  imgProps,
}: CoverArtProps) {
  const f = frame ?? "fill";
  return (
    <div className={cn(coverArtVariants({ frame: f, className }))}>
      {url ? (
        <img
          src={url}
          alt={alt}
          className={cn("h-full w-full object-cover", imgClassName)}
          loading="lazy"
          decoding="async"
          {...imgProps}
        />
      ) : (
        <Music
          className={cn(iconVariants({ frame: f }))}
          aria-label="No album cover"
        />
      )}
    </div>
  );
}

export { coverArtVariants };
