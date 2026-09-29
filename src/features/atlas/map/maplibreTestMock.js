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
    this.layers = {};
    this.handlers = {};
    this.addSource = vi.fn((id, source) => {
      this.sources[id] = {
        ...source,
        setData: vi.fn((data) => {
          this.sources[id].data = data;
        }),
      };
    });
    this.addLayer = vi.fn((layer) => {
      this.layers[layer.id] = layer;
    });
    this.getLayer = (id) => this.layers[id];
    this.removeLayer = vi.fn((id) => {
      delete this.layers[id];
    });
    this.removeSource = vi.fn((id) => {
      delete this.sources[id];
    });
    this.setTerrain = vi.fn();
    this.setPaintProperty = vi.fn();
    this.setLayoutProperty = vi.fn();
    this.queryRenderedFeatures = vi.fn(() => []);
    this.flyTo = vi.fn();
    this.resize = vi.fn();
    this.remove = vi.fn(() => this.canvas.remove());
    mapInstances.push(this);
  }
  on(event, layerOrHandler, handler) {
    this.handlers[event] = handler || layerOrHandler;
    if (handler) this.handlers[`${event}:${layerOrHandler}`] = handler;
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
