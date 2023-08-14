import "@testing-library/jest-dom"
import matchers from "@testing-library/jest-dom/matchers"
import { expect, vi } from "vitest"

// extends Vitest's expect method with methods from react-testing-library
expect.extend(matchers)

vi.mock("zustand")

// https://github.com/vitest-dev/vitest/issues/821
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})
