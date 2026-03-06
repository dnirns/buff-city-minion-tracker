import { render, screen, cleanup, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import DiceRoller from "./DiceRoller";
import type { DiceStep } from "./DiceRoller";

vi.mock("@react-three/fiber", () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="canvas">{children}</div>
  ),
  useFrame: vi.fn(),
}));

vi.mock("@react-three/drei", () => ({
  Edges: () => null,
}));

vi.mock("three", () => {
  class MockQuaternion {
    setFromUnitVectors() { return this; }
    copy() { return this; }
    slerp() { return this; }
    setFromAxisAngle() { return this; }
    multiply() { return this; }
  }

  class MockVector3 {
    x = 0; y = 0; z = 0;
    constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
    normalize() { return this; }
    clone() { return new MockVector3(this.x, this.y, this.z); }
    applyQuaternion() { return this; }
  }

  const mockGeometryAttrs = {
    getAttribute: () => ({ count: 0, getX: () => 0, getY: () => 0, getZ: () => 0 }),
    computeVertexNormals: () => {},
  };

  return {
    Vector3: MockVector3,
    Quaternion: MockQuaternion,
    BoxGeometry: class { getAttribute = mockGeometryAttrs.getAttribute; computeVertexNormals = mockGeometryAttrs.computeVertexNormals; },
    TetrahedronGeometry: class { getAttribute = mockGeometryAttrs.getAttribute; computeVertexNormals = mockGeometryAttrs.computeVertexNormals; },
    DodecahedronGeometry: class { getAttribute = mockGeometryAttrs.getAttribute; computeVertexNormals = mockGeometryAttrs.computeVertexNormals; },
    BufferGeometry: class {},
    Group: class {},
  };
});

describe("DiceRoller", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  const sampleSteps: DiceStep[] = [
    { label: "Spawn", sides: 12, finalValue: 7, resultText: "Goon" },
    { label: "Edge", sides: 6, finalValue: 3, resultText: "Edge 3" },
  ];

  it("renders the overlay", () => {
    const { container } = render(
      <DiceRoller steps={sampleSteps} onComplete={vi.fn()} />
    );
    expect(container.firstChild).toBeTruthy();
  });

  it("renders all step labels", () => {
    render(<DiceRoller steps={sampleSteps} onComplete={vi.fn()} />);
    expect(screen.getByText("Spawn")).toBeInTheDocument();
    expect(screen.getByText("Edge")).toBeInTheDocument();
  });

  it("renders die type labels (D12, D6)", () => {
    render(<DiceRoller steps={sampleSteps} onComplete={vi.fn()} />);
    expect(screen.getByText("D12")).toBeInTheDocument();
    expect(screen.getByText("D6")).toBeInTheDocument();
  });

  it("renders a single step", () => {
    const steps: DiceStep[] = [
      { label: "Intent", sides: 6, finalValue: 4, resultText: "Combat" },
    ];
    render(<DiceRoller steps={steps} onComplete={vi.fn()} />);
    expect(screen.getByText("Intent")).toBeInTheDocument();
    expect(screen.getByText("D6")).toBeInTheDocument();
  });

  it("renders three steps", () => {
    const steps: DiceStep[] = [
      { label: "Spawn", sides: 12, finalValue: 7, resultText: "Goon" },
      { label: "Edge", sides: 6, finalValue: 3, resultText: "Edge 3" },
      { label: "Intent", sides: 6, finalValue: 1, resultText: "Combat" },
    ];
    render(<DiceRoller steps={steps} onComplete={vi.fn()} />);
    expect(screen.getByText("Spawn")).toBeInTheDocument();
    expect(screen.getByText("Edge")).toBeInTheDocument();
    expect(screen.getByText("Intent")).toBeInTheDocument();
  });

  it("shows result text after die lands", () => {
    const steps: DiceStep[] = [
      { label: "Spawn", sides: 12, finalValue: 7, resultText: "Goon" },
    ];
    render(<DiceRoller steps={steps} onComplete={vi.fn()} />);

    // Before landing, result text is non-breaking space
    expect(screen.queryByText("Goon")).not.toBeInTheDocument();

    // DieWithNumber timer: ROLL_DURATION(1000) + LAND_DURATION(200) = 1200ms
    act(() => { vi.advanceTimersByTime(1200); });
    // RollingNumber settle delay: 200ms → triggers handleLanded
    act(() => { vi.advanceTimersByTime(200); });

    expect(screen.getByText("Goon")).toBeInTheDocument();
  });

  it("shows final value after die lands", () => {
    const steps: DiceStep[] = [
      { label: "Test", sides: 6, finalValue: 4, resultText: "Result" },
    ];
    render(<DiceRoller steps={steps} onComplete={vi.fn()} />);

    // Land the die
    act(() => { vi.advanceTimersByTime(1200); });

    // RollingNumber shows finalValue when landed
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("calls onComplete after all steps finish", () => {
    const onComplete = vi.fn();
    const steps: DiceStep[] = [
      { label: "Spawn", sides: 12, finalValue: 7, resultText: "Goon" },
    ];
    render(<DiceRoller steps={steps} onComplete={onComplete} />);

    // DieWithNumber timer fires
    act(() => { vi.advanceTimersByTime(1200); });
    // RollingNumber settle → handleLanded(0)
    act(() => { vi.advanceTimersByTime(200); });

    expect(onComplete).not.toHaveBeenCalled();

    // Last step → PAUSE_BETWEEN(600) + 400 = 1000ms
    act(() => { vi.advanceTimersByTime(1000); });

    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("advances through multiple steps sequentially", () => {
    const onComplete = vi.fn();
    const steps: DiceStep[] = [
      { label: "Spawn", sides: 12, finalValue: 7, resultText: "Goon" },
      { label: "Edge", sides: 6, finalValue: 3, resultText: "Edge 3" },
    ];
    render(<DiceRoller steps={steps} onComplete={onComplete} />);

    // Step 0: DieWithNumber timer fires
    act(() => { vi.advanceTimersByTime(1200); });
    // Step 0: RollingNumber settle → handleLanded(0)
    act(() => { vi.advanceTimersByTime(200); });
    expect(screen.getByText("Goon")).toBeInTheDocument();

    // Pause between steps → setActiveStep(1)
    act(() => { vi.advanceTimersByTime(600); });

    // Step 1: DieWithNumber timer fires
    act(() => { vi.advanceTimersByTime(1200); });
    // Step 1: RollingNumber settle → handleLanded(1)
    act(() => { vi.advanceTimersByTime(200); });
    expect(screen.getByText("Edge 3")).toBeInTheDocument();

    expect(onComplete).not.toHaveBeenCalled();

    // Final pause: PAUSE_BETWEEN(600) + 400 = 1000ms
    act(() => { vi.advanceTimersByTime(1000); });
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("shows non-rolling die with static final value", () => {
    const steps: DiceStep[] = [
      { label: "Spawn", sides: 12, finalValue: 7, resultText: "Goon" },
      { label: "Edge", sides: 6, finalValue: 3, resultText: "Edge 3" },
    ];
    render(<DiceRoller steps={steps} onComplete={vi.fn()} />);

    // Complete step 0
    act(() => { vi.advanceTimersByTime(1200); });
    act(() => { vi.advanceTimersByTime(200); });
    // Pause between steps → activeStep moves to 1
    act(() => { vi.advanceTimersByTime(600); });

    // Step 0 is now non-rolling, should show its finalValue as static text
    expect(screen.getByText("7")).toBeInTheDocument();
  });
});
