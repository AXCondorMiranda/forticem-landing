const fs = require("fs");
const path = require("path");

const meshes = [
  { positions: [], normals: [], indices: [], material: 0 },
  { positions: [], normals: [], indices: [], material: 1 },
  { positions: [], normals: [], indices: [], material: 2 },
  { positions: [], normals: [], indices: [], material: 3 },
];

function addBox(mesh, minX, maxX, minY, maxY, minZ, maxZ) {
  const faces = [
    { n: [0, 1, 0], v: [[minX, maxY, minZ], [maxX, maxY, minZ], [maxX, maxY, maxZ], [minX, maxY, maxZ]] },
    { n: [0, -1, 0], v: [[minX, minY, maxZ], [maxX, minY, maxZ], [maxX, minY, minZ], [minX, minY, minZ]] },
    { n: [1, 0, 0], v: [[maxX, minY, minZ], [maxX, minY, maxZ], [maxX, maxY, maxZ], [maxX, maxY, minZ]] },
    { n: [-1, 0, 0], v: [[minX, minY, maxZ], [minX, minY, minZ], [minX, maxY, minZ], [minX, maxY, maxZ]] },
    { n: [0, 0, 1], v: [[maxX, minY, maxZ], [minX, minY, maxZ], [minX, maxY, maxZ], [maxX, maxY, maxZ]] },
    { n: [0, 0, -1], v: [[minX, minY, minZ], [maxX, minY, minZ], [maxX, maxY, minZ], [minX, maxY, minZ]] },
  ];

  for (const face of faces) {
    const base = mesh.positions.length / 3;
    for (const vertex of face.v) {
      mesh.positions.push(...vertex);
      mesh.normals.push(...face.n);
    }
    mesh.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
}

function addTopDisk(mesh, cx, cz, radius, sides, y) {
  const base = mesh.positions.length / 3;
  mesh.positions.push(cx, y, cz);
  mesh.normals.push(0, 1, 0);

  for (let i = 0; i < sides; i += 1) {
    const angle = (Math.PI * 2 * i) / sides;
    const squash = 0.72 + ((i * 17) % 9) / 30;
    mesh.positions.push(cx + Math.cos(angle) * radius * squash, y, cz + Math.sin(angle) * radius);
    mesh.normals.push(0, 1, 0);
  }

  for (let i = 1; i <= sides; i += 1) {
    mesh.indices.push(base, base + i, base + (i % sides) + 1);
  }
}

function addSideChip(mesh, x0, x1, y0, y1, z, normalZ) {
  const base = mesh.positions.length / 3;
  mesh.positions.push(x0, y0, z, x1, y0, z, x1, y1, z, x0, y1, z);
  mesh.normals.push(0, 0, normalZ, 0, 0, normalZ, 0, 0, normalZ, 0, 0, normalZ);
  mesh.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
}

let seed = 415;
function random() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
}

const cell = 0.54;
const gap = 0;
const pitch = cell + gap;
const height = 0.46;
const topY = height + 0.004;
const occupiedCells = [];

const outer = pitch * 2.5;
const bars = [
  { minX: -outer, maxX: outer, minZ: -pitch * 1.5, maxZ: -pitch * 0.5 },
  { minX: -outer, maxX: outer, minZ: pitch * 0.5, maxZ: pitch * 1.5 },
  { minX: -pitch * 1.5, maxX: -pitch * 0.5, minZ: -outer, maxZ: -pitch * 1.5 },
  { minX: -pitch * 1.5, maxX: -pitch * 0.5, minZ: -pitch * 0.5, maxZ: pitch * 0.5 },
  { minX: -pitch * 1.5, maxX: -pitch * 0.5, minZ: pitch * 1.5, maxZ: outer },
  { minX: pitch * 0.5, maxX: pitch * 1.5, minZ: -outer, maxZ: -pitch * 1.5 },
  { minX: pitch * 0.5, maxX: pitch * 1.5, minZ: -pitch * 0.5, maxZ: pitch * 0.5 },
  { minX: pitch * 0.5, maxX: pitch * 1.5, minZ: pitch * 1.5, maxZ: outer },
];

for (const bar of bars) {
  occupiedCells.push(bar);
  addBox(meshes[0], bar.minX, bar.maxX, 0, height, bar.minZ, bar.maxZ);
}

function isConcreteTop(x, z) {
  return occupiedCells.some((cellBounds) => (
    x >= cellBounds.minX &&
    x <= cellBounds.maxX &&
    z >= cellBounds.minZ &&
    z <= cellBounds.maxZ
  ));
}

for (let i = 0; i < 150; i += 1) {
  const spread = outer * 0.98;
  const x = (random() * 2 - 1) * spread;
  const z = (random() * 2 - 1) * spread;
  if (!isConcreteTop(x, z)) continue;

  const materialMesh = random() > 0.72 ? meshes[1] : random() > 0.48 ? meshes[2] : meshes[3];
  const radius = 0.01 + random() * 0.02;
  addTopDisk(materialMesh, x, z, radius, 7 + Math.floor(random() * 4), topY + random() * 0.002);
}

for (let i = 0; i < 36; i += 1) {
  const cellBounds = occupiedCells[Math.floor(random() * occupiedCells.length)];
  const y = 0.08 + random() * 0.3;
  const w = 0.025 + random() * 0.045;
  const h = 0.012 + random() * 0.032;
  const x = cellBounds.minX + random() * (cellBounds.maxX - cellBounds.minX - w);
  const z = random() > 0.5 ? cellBounds.maxZ + 0.003 : cellBounds.minZ - 0.003;
  const normalZ = z > 0 ? 1 : -1;
  addSideChip(random() > 0.55 ? meshes[1] : meshes[2], x, x + w, y, y + h, z, normalZ);
}

function bounds(values) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < values.length; i += 3) {
    min[0] = Math.min(min[0], values[i]);
    min[1] = Math.min(min[1], values[i + 1]);
    min[2] = Math.min(min[2], values[i + 2]);
    max[0] = Math.max(max[0], values[i]);
    max[1] = Math.max(max[1], values[i + 1]);
    max[2] = Math.max(max[2], values[i + 2]);
  }
  return { min, max };
}

function align4(value) {
  return (value + 3) & ~3;
}

function floatBuffer(values) {
  const buffer = Buffer.alloc(values.length * 4);
  values.forEach((value, index) => buffer.writeFloatLE(value, index * 4));
  return buffer;
}

function indexBuffer(values) {
  const buffer = Buffer.alloc(values.length * 2);
  values.forEach((value, index) => buffer.writeUInt16LE(value, index * 2));
  return buffer;
}

const chunks = [];
const bufferViews = [];
const accessors = [];

function pushBuffer(buffer, target) {
  const byteOffset = chunks.reduce((total, chunk) => total + align4(chunk.length), 0);
  chunks.push(buffer);
  bufferViews.push({ buffer: 0, byteOffset, byteLength: buffer.length, target });
  return bufferViews.length - 1;
}

function pushAccessor(buffer, target, componentType, type, count, min, max) {
  const view = pushBuffer(buffer, target);
  const accessor = { bufferView: view, byteOffset: 0, componentType, count, type };
  if (min) accessor.min = min;
  if (max) accessor.max = max;
  accessors.push(accessor);
  return accessors.length - 1;
}

function addPrimitive(mesh) {
  const positionBounds = bounds(mesh.positions);
  return {
    attributes: {
      POSITION: pushAccessor(floatBuffer(mesh.positions), 34962, 5126, "VEC3", mesh.positions.length / 3, positionBounds.min, positionBounds.max),
      NORMAL: pushAccessor(floatBuffer(mesh.normals), 34962, 5126, "VEC3", mesh.normals.length / 3),
    },
    indices: pushAccessor(indexBuffer(mesh.indices), 34963, 5123, "SCALAR", mesh.indices.length, [0], [Math.max(...mesh.indices)]),
    material: mesh.material,
  };
}

const primitives = meshes
  .filter((mesh) => mesh.positions.length > 0)
  .map(addPrimitive);

const paddedBinary = Buffer.concat(chunks.map((chunk) => {
  const padded = Buffer.alloc(align4(chunk.length));
  chunk.copy(padded);
  return padded;
}));

const gltf = {
  asset: { version: "2.0", generator: "Forticem procedural concrete michi block generator" },
  scene: 0,
  scenes: [{ nodes: [0] }],
  nodes: [{ mesh: 0, name: "Block Grass Tipo Michi" }],
  meshes: [{ name: "Forticem Block Grass Tipo Michi", primitives }],
  materials: [
    {
      name: "Concreto claro rugoso",
      pbrMetallicRoughness: {
        baseColorFactor: [0.66, 0.63, 0.57, 1],
        metallicFactor: 0,
        roughnessFactor: 0.96,
      },
    },
    {
      name: "Poros oscuros",
      doubleSided: true,
      pbrMetallicRoughness: {
        baseColorFactor: [0.24, 0.23, 0.21, 1],
        metallicFactor: 0,
        roughnessFactor: 1,
      },
    },
    {
      name: "Piedra clara",
      doubleSided: true,
      pbrMetallicRoughness: {
        baseColorFactor: [0.8, 0.78, 0.72, 1],
        metallicFactor: 0,
        roughnessFactor: 1,
      },
    },
    {
      name: "Agregado calido",
      doubleSided: true,
      pbrMetallicRoughness: {
        baseColorFactor: [0.68, 0.56, 0.46, 1],
        metallicFactor: 0,
        roughnessFactor: 1,
      },
    },
  ],
  buffers: [{ byteLength: paddedBinary.length }],
  bufferViews,
  accessors,
};

const json = Buffer.from(JSON.stringify(gltf), "utf8");
const paddedJson = Buffer.alloc(align4(json.length), 0x20);
json.copy(paddedJson);

const header = Buffer.alloc(12);
header.writeUInt32LE(0x46546c67, 0);
header.writeUInt32LE(2, 4);
header.writeUInt32LE(12 + 8 + paddedJson.length + 8 + paddedBinary.length, 8);

const jsonHeader = Buffer.alloc(8);
jsonHeader.writeUInt32LE(paddedJson.length, 0);
jsonHeader.writeUInt32LE(0x4e4f534a, 4);

const binaryHeader = Buffer.alloc(8);
binaryHeader.writeUInt32LE(paddedBinary.length, 0);
binaryHeader.writeUInt32LE(0x004e4942, 4);

const output = Buffer.concat([header, jsonHeader, paddedJson, binaryHeader, paddedBinary]);
const outPath = path.join(__dirname, "..", "models", "block-grass.glb");
fs.writeFileSync(outPath, output);
console.log(`Generated ${outPath} (${output.length} bytes)`);
