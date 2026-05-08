import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { App } from "../../App";

describe("SlideWorkbench", () => {
  it("renders project links and build metadata", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: /OpenSlide StarDist Viewer/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Star/i })).toHaveAttribute(
      "href",
      "https://github.com/baditaflorin/openslide-stardist-viewer",
    );
    expect(screen.getByRole("link", { name: /PayPal/i })).toHaveAttribute(
      "href",
      "https://www.paypal.com/paypalme/florinbadita",
    );
  });
});
