let modelViewerPromise;
export const LOCAL_MODEL_VIEWER_CONFIGURED = true;
export const LOCAL_MESHOPT_DECODER_URL =
  "/vendor/meshoptimizer/meshopt_decoder.js";

function configureLocalDecoders() {
  const ModelViewerElement = globalThis.customElements?.get("model-viewer");

  if (ModelViewerElement) {
    ModelViewerElement.meshoptDecoderLocation = LOCAL_MESHOPT_DECODER_URL;
  }
}

export function loadModelViewer(
  importer = () => import("@google/model-viewer")
) {
  if (!modelViewerPromise) {
    modelViewerPromise = importer()
      .then((module) => {
        configureLocalDecoders();
        return module;
      })
      .catch((error) => {
        modelViewerPromise = undefined;
        throw error;
      });
  }
  return modelViewerPromise;
}

export function resetModelViewerLoaderForTests() {
  modelViewerPromise = undefined;
}
