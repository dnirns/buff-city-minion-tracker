import { render, screen, act, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import DefeatAnimation from "./DefeatAnimation";

vi.mock("next/image", () => ({
  default: ({ src, alt, width, height, className }: { src: string; alt: string; width: number; height: number; className?: string }) => (
    <img src={src} alt={alt} width={width} height={height} className={className} />
  ),
}));

describe("DefeatAnimation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("renders the enemy name and type", () => {
    render(
      <DefeatAnimation
        enemyName="Goon 1"
        enemyType="Goon"
        onComplete={vi.fn()}
      />
    );
    expect(screen.getByText("Goon 1 (Goon)")).toBeInTheDocument();
  });

  it("renders the 'Wasted' label", () => {
    render(
      <DefeatAnimation
        enemyName="Henchman 2"
        enemyType="Henchman"
        onComplete={vi.fn()}
      />
    );
    expect(screen.getByText("Wasted")).toBeInTheDocument();
  });

  it("renders the defeat image", () => {
    render(
      <DefeatAnimation
        enemyName="Lt 1"
        enemyType="Lieutenant"
        onComplete={vi.fn()}
      />
    );
    const img = screen.getByAltText("Defeated");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/assets/oz-transparent.svg");
  });

  it("calls onComplete after animation duration (2200ms)", () => {
    const onComplete = vi.fn();
    render(
      <DefeatAnimation
        enemyName="Goon 1"
        enemyType="Goon"
        onComplete={onComplete}
      />
    );

    expect(onComplete).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(2199);
    });
    expect(onComplete).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("cleans up timer on unmount", () => {
    const onComplete = vi.fn();
    const { unmount } = render(
      <DefeatAnimation
        enemyName="Goon 1"
        enemyType="Goon"
        onComplete={onComplete}
      />
    );

    unmount();

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("uses the latest onComplete callback via ref", () => {
    const onComplete1 = vi.fn();
    const onComplete2 = vi.fn();

    const { rerender } = render(
      <DefeatAnimation
        enemyName="Goon 1"
        enemyType="Goon"
        onComplete={onComplete1}
      />
    );

    rerender(
      <DefeatAnimation
        enemyName="Goon 1"
        enemyType="Goon"
        onComplete={onComplete2}
      />
    );

    act(() => {
      vi.advanceTimersByTime(2200);
    });

    expect(onComplete1).not.toHaveBeenCalled();
    expect(onComplete2).toHaveBeenCalledOnce();
  });
});
