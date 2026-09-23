// Builds the web model from the Blender export copy in assets-src/.
// The original Blender project is never touched; re-export PC_Setup_Hero.glb,
// copy it to assets-src/pc-setup-source.glb, then run `npm run model:optimize`.
import { statSync } from 'node:fs';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, join, meshopt, prune, textureCompress, weld } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';
import sharp from 'sharp';

const SOURCE = 'assets-src/pc-setup-source.glb';
const TARGET = 'public/models/pc-setup.glb';

// Tiny repeated parts whose individual names the site never needs. Clearing
// their names lets join() merge them into one draw call per material.
const MERGEABLE = /^Monitor_Right_Neck_Pleat/;

await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready]);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'meshopt.encoder': MeshoptEncoder,
  'meshopt.decoder': MeshoptDecoder,
});

const doc = await io.read(SOURCE);
for (const node of doc.getRoot().listNodes()) {
  if (!MERGEABLE.test(node.getName())) continue;
  node.setName('');
  node.getMesh()?.setName('');
}

await doc.transform(
  dedup(),
  join({ keepNamed: true }),
  weld(),
  prune({ keepLeaves: true }),
  textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [1024, 1024], quality: 85 }),
  meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
);

await io.write(TARGET, doc);
const mb = (p) => (statSync(p).size / 1024 / 1024).toFixed(2);
console.log(`${SOURCE} (${mb(SOURCE)} MB) → ${TARGET} (${mb(TARGET)} MB)`);
