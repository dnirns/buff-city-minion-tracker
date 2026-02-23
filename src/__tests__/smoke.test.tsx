import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

function Greeting({ name }: { name: string }) {
  return <h1>Hello, {name}!</h1>;
}

describe("Vitest smoke test", () => {
  it("should pass a basic assertion", () => {
    expect(1 + 1).toBe(2);
  });

  it("should render a React component", () => {
    render(<Greeting name="Blok City" />);
    expect(screen.getByText("Hello, Blok City!")).toBeInTheDocument();
  });
});
