import { beforeEach, vi } from "vitest";
export const mapInstances = [];
export const mockSettings = { autoLoad: true };
beforeEach(() => {
  mapInstances.length = 0;
  mockSettings.autoLoad = true;
});
class MockMap {
  constructor(options) {
    this.options = options;
    this.container = options.container;
    this.canvas = document.createElement("canvas");
    this.canvas.className = "maplibregl-canvas";
    this.canvas.tabIndex = 0;
    this.container.append(this.canvas);
    this.sources = {};
    this.handlers = {};
    this.addSource = vi.fn((id, source) => {
      this.sources[id] = {
        ...source,
        setData: vi.fn((data) => {
          this.sources[id].data = data;
        }),
      };
    });
    this.addLayer = vi.fn();
    this.setPaintProperty = vi.fn();
    this.flyTo = vi.fn();
    this.resize = vi.fn();
    this.remove = vi.fn(() => this.canvas.remove());
    mapInstances.push(this);
  }
  on(event, layerOrHandler, handler) {
    this.handlers[event] = handler || layerOrHandler;
    if (event === "load" && mockSettings.autoLoad) this.handlers[event]();
    return this;
  }
  off() {
    return this;
  }
  addControl() {
    return this;
  }
  getSource(id) {
    return this.sources[id];
  }
  getZoom() {
    return 4;
  }
  getCanvas() {
    return this.canvas;
  }
}
export const mockMapLibre = {
  Map: MockMap,
  NavigationControl: class {},
  setWorkerUrl: vi.fn(),
};
