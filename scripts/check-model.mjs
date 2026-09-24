// Verifies the web model keeps the nodes the scene code depends on, and prints
// the numbers that matter for tuning (bounds, draw calls, triangles, size).
import { statSync } from 'node:fs';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { getBounds } from '@gltf-transform/functions';
import { MeshoptDecoder } from 'meshoptimizer';

const REQUIRED_NODES = [
  'Desk',
  'PC_Case',
  'Monitor_Left',
  'Monitor_Center',
  'Monitor_Center_Screen',
  'Monitor_Right',
  'Keyboard',
  'Mouse',
  'Chair',
  'Whiteboard',
  'Whiteboard_Surface',
  'Whiteboard_Tray',
  ...[1, 2, 3, 4, 5, 6].map((i) => `Whiteboard_Marker_${String(i).padStart(2, '0')}_${['Black', 'Red', 'Blue', 'Black', 'Green', 'Red'][i - 1]}`),
];

const file = process.argv[2] ?? 'public/models/pc-setup.glb';
await MeshoptDecoder.ready;
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const doc = await io.read(file);
const root = doc.getRoot();
const scene = root.getDefaultScene() ?? root.listScenes()[0];

const names = new Set(root.listNodes().map((n) => n.getName()));
const missing = REQUIRED_NODES.filter((n) => !names.has(n));

let primitives = 0;
let triangles = 0;
for (const mesh of root.listMeshes()) {
  for (const prim of mesh.listPrimitives()) {
    primitives += 1;
    const count = prim.getIndices()?.getCount() ?? prim.getAttribute('POSITION')?.getCount() ?? 0;
    triangles += count / 3;
  }
}

const fmt = (v) => v.map((x) => x.toFixed(3)).join(', ');
console.log(`file        ${file} (${(statSync(file).size / 1024 / 1024).toFixed(2)} MB)`);
console.log(`nodes       ${root.listNodes().length}`);
console.log(`meshes      ${root.listMeshes().length} (${primitives} primitives ≈ draw calls)`);
console.log(`triangles   ${Math.round(triangles).toLocaleString()}`);
console.log(`materials   ${root.listMaterials().length}`);
console.log(`textures    ${root.listTextures().map((t) => `${t.getName() || '?'} ${t.getMimeType()} ${t.getSize()?.join('x')}`).join(' | ')}`);
console.log(`extensions  ${root.listExtensionsUsed().map((e) => e.extensionName).join(', ')}`);
const sb = getBounds(scene);
console.log(`scene bbox  min(${fmt(sb.min)}) max(${fmt(sb.max)})`);
for (const name of REQUIRED_NODES) {
  const node = root.listNodes().find((n) => n.getName() === name);
  if (!node) continue;
  const b = getBounds(node);
  console.log(`  ${name.padEnd(22)} min(${fmt(b.min)}) max(${fmt(b.max)})`);
}
console.log('top-level:', scene.listChildren().map((n) => `${n.getName()}[${n.listChildren().length}]`).join(' '));

if (missing.length) {
  console.error(`\nMISSING required nodes: ${missing.join(', ')}`);
  process.exit(1);
}
console.log('\nOK — all required nodes present.');
