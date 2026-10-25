import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { fakeApi, server } from "./server";

/*
 * jsdom has no WebGL and no layout. These stand-ins let the 3D figures and the charts run their
 * real code paths in tests: three's renderer draws nothing, a canvas reports a WebGL context,
 * and observed elements report a fixed size.
 */
const noop = () => undefined;

vi.mock("three", async (importOriginal) => {
  const three = await importOriginal<typeof import("three")>();
  class FakeWebGLRenderer {
    readonly domElement: HTMLCanvasElement;
    outputColorSpace = "";
    setPixelRatio = noop;
    setSize = noop;
    setClearColor = noop;
    render = noop;
    clear = noop;
    setViewport = noop;
    setScissor = noop;
    setScissorTest = noop;
    dispose = noop;
    forceContextLoss = noop;
    constructor(options: { canvas?: HTMLCanvasElement } = {}) {
      this.domElement = options.canvas ?? document.createElement("canvas");
    }
  }
  return { ...three, WebGLRenderer: FakeWebGLRenderer };
});

HTMLCanvasElement.prototype.getContext = function getContext(type: string) {
  return type.startsWith("webgl") ? ({} as RenderingContext) : null;
} as typeof HTMLCanvasElement.prototype.getContext;

/** Reports a 800 × 600 box for every observed element, once, like a first layout. */
class FixedSizeResizeObserver {
  private readonly callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }
  observe(target: Element) {
    queueMicrotask(() => {
      const contentRect = { width: 800, height: 600 } as DOMRectReadOnly;
      this.callback([{ target, contentRect } as ResizeObserverEntry], this);
    });
  }
  unobserve = noop;
  disconnect = noop;
}

class AlwaysVisibleIntersectionObserver {
  observe = noop;
  unobserve = noop;
  disconnect = noop;
  takeRecords = () => [];
}

vi.stubGlobal("ResizeObserver", FixedSizeResizeObserver);
vi.stubGlobal("IntersectionObserver", AlwaysVisibleIntersectionObserver);
vi.stubGlobal(
  "matchMedia",
  (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: noop,
      removeEventListener: noop,
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList,
);

beforeAll(() => {
  server.listen({ onUnhandledFrame: "error" });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  fakeApi.experiments.clear();
});

afterAll(() => {
  server.close();
});
