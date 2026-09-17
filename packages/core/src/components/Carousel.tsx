import { useState } from "react";
import type { ReactNode } from "react";
import clsx from "clsx";
import { Button } from "./Button";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

export interface CarouselProps {
  /** One slide per child. */
  children: ReactNode[];
  className?: string;
  /** Uncontrolled starting slide. Ignored if `index` is set. */
  defaultIndex?: number;
  /** Controlled active slide. */
  index?: number;
  onIndexChange?: (index: number) => void;
  "aria-label"?: string;
}

export function Carousel({
  children,
  className,
  defaultIndex = 0,
  index: controlledIndex,
  onIndexChange,
  "aria-label": ariaLabel = "Carousel",
}: CarouselProps) {
  const slides = children;
  const [uncontrolledIndex, setUncontrolledIndex] = useState(defaultIndex);
  const index = controlledIndex ?? uncontrolledIndex;
  const count = slides.length;

  const goTo = (next: number) => {
    const clamped = Math.max(0, Math.min(count - 1, next));
    setUncontrolledIndex(clamped);
    onIndexChange?.(clamped);
  };

  return (
    <div
      className={clsx("rebar-carousel", className)}
      data-rebar-component="carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") goTo(index - 1);
        if (event.key === "ArrowRight") goTo(index + 1);
      }}
    >
      <div className="rebar-carousel-viewport" data-rebar-part="viewport">
        <div
          className="rebar-carousel-track"
          data-rebar-part="track"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((slide, i) => (
            <div
              key={i}
              className="rebar-carousel-slide"
              data-rebar-part="slide"
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              aria-hidden={i !== index}
            >
              {slide}
            </div>
          ))}
        </div>
      </div>

      <div className="rebar-carousel-controls" data-rebar-part="controls">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          aria-label="Previous slide"
          disabled={index === 0}
          onClick={() => goTo(index - 1)}
        >
          <ChevronLeftIcon />
        </Button>

        <span className="rebar-carousel-status" aria-live="polite">
          {index + 1} of {count}
        </span>

        <div className="rebar-carousel-dots" data-rebar-part="dots">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              className="rebar-carousel-dot"
              data-rebar-part="dot"
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === index}
              onClick={() => goTo(i)}
            />
          ))}
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          aria-label="Next slide"
          disabled={index === count - 1}
          onClick={() => goTo(index + 1)}
        >
          <ChevronRightIcon />
        </Button>
      </div>
    </div>
  );
}
