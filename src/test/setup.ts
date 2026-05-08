import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  arc: vi.fn(),
  beginPath: vi.fn(),
  clearRect: vi.fn(),
  fill: vi.fn(),
  scale: vi.fn(),
  strokeRect: vi.fn(),
})) as unknown as HTMLCanvasElement["getContext"];
