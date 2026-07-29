import fs from "node:fs";
import path from "node:path";

export const MODEL_EXTENSIONS = new Set([".glb", ".gltf"]);

const imageDimensions = (buffer, mime = "") => {
  if (
    (mime.includes("png") || buffer.subarray(1, 4).toString() === "PNG") &&
    buffer.length >= 24
  ) {
    return [buffer.readUInt32BE(16), buffer.readUInt32BE(20)];
  }
  if (
    mime.includes("jpeg") ||
    mime.includes("jpg") ||
    (buffer[0] === 0xff && buffer[1] === 0xd8)
  ) {
    let offset = 2;
    const sof = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = buffer[offset + 1];
      if (sof.has(marker)) {
        return [buffer.readUInt16BE(offset + 7), buffer.readUInt16BE(offset + 5)];
      }
      const length = buffer.readUInt16BE(offset + 2);
      if (!length) break;
      offset += 2 + length;
    }
  }
  if (mime.includes("webp") || buffer.subarray(8, 12).toString() === "WEBP") {
    const kind = buffer.subarray(12, 16).toString();
    if (kind === "VP8X" && buffer.length >= 30) {
      return [1 + buffer.readUIntLE(24, 3), 1 + buffer.readUIntLE(27, 3)];
    }
    if (kind === "VP8 " && buffer.length >= 30) {
      return [buffer.readUInt16LE(26) & 0x3fff, buffer.readUInt16LE(28) & 0x3fff];
    }
    if (kind === "VP8L" && buffer.length >= 25) {
      const bits = buffer.readUInt32LE(21);
      return [(bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1];
    }
  }
  return [0, 0];
};

export const readGlbInfo = (filePath) => {
  const data = fs.readFileSync(filePath);
  if (data.readUInt32LE(0) !== 0x46546c67) {
    throw new Error(`${filePath} is not a binary glTF file`);
  }
  const jsonLength = data.readUInt32LE(12);
  const json = JSON.parse(data.subarray(20, 20 + jsonLength).toString("utf8").trim());
  const binaryOffset = 20 + jsonLength;
  const binaryLength = data.readUInt32LE(binaryOffset);
  const binary = data.subarray(binaryOffset + 8, binaryOffset + 8 + binaryLength);
  const images = (json.images || []).map((image) => {
    const view = json.bufferViews?.[image.bufferView];
    if (!view) return { bytes: 0, width: 0, height: 0, mime: image.mimeType || "" };
    const bytes = binary.subarray(view.byteOffset || 0, (view.byteOffset || 0) + view.byteLength);
    const [width, height] = imageDimensions(bytes, image.mimeType || "");
    return { bytes: bytes.length, width, height, mime: image.mimeType || "" };
  });
  const primitives = (json.meshes || []).flatMap((mesh) => mesh.primitives || []);
  const vertices = primitives.reduce(
    (count, primitive) => count + (json.accessors?.[primitive.attributes?.POSITION]?.count || 0),
    0
  );
  const indices = primitives.reduce(
    (count, primitive) => count + (json.accessors?.[primitive.indices]?.count || 0),
    0
  );
  return {
    file: path.basename(filePath),
    bytes: data.length,
    meshes: json.meshes?.length || 0,
    primitives: primitives.length,
    materials: json.materials?.length || 0,
    textures: json.textures?.length || 0,
    images,
    vertices,
    triangles: Math.floor(indices / 3),
    nodes: json.nodes?.length || 0,
    animations: json.animations?.length || 0,
    extensionsUsed: json.extensionsUsed || [],
    compression: (json.extensionsUsed || []).filter((extension) =>
      ["EXT_meshopt_compression", "KHR_draco_mesh_compression"].includes(extension)
    ),
  };
};

export const listModelFiles = (directory) =>
  fs.existsSync(directory)
    ? fs
        .readdirSync(directory)
        .filter((file) => MODEL_EXTENSIONS.has(path.extname(file).toLowerCase()))
        .map((file) => path.join(directory, file))
    : [];
