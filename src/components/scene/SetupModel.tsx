import { useLayoutEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Box3, Matrix4, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, Quaternion, Vector3, type Object3D } from 'three';
import { LED_MATERIALS, MODEL_NODES, MODEL_PLACEMENT, MODEL_URL, PHONE_PLACEMENT, RENDER } from '../../config/scene';
import { useSceneLayout } from '../../store/sceneLayout';
import { useExperience } from '../../store/experience';
import { clamp, easeInOutCubic } from '../../lib/math';
import type { ScreenRect, Vec3 } from '../../types/scene';

// Start downloading as soon as this module is evaluated.
useGLTF.preload(MODEL_URL, false, true);

/** Loads the Blender export and places it so the desk top sits at the origin. */
export function SetupModel() {
  const { scene } = useGLTF(MODEL_URL, false, true);
  const setLayout = useSceneLayout((s) => s.setLayout);

  // All measurements are taken relative to the glTF root, so they don't depend
  // on where (or whether) the model is currently attached.
  const layout = useMemo(() => {
    const s = MODEL_PLACEMENT.scale;
    const desk = boundsInModel(scene, requireNode(scene, MODEL_PLACEMENT.anchorNode));
    const offset = new Vector3(-(desk.min.x + desk.max.x) / 2, -desk.max.y, -(desk.min.z + desk.max.z) / 2).multiplyScalar(s);
    const toDesk = (v: Vector3): Vec3 => [v.x * s + offset.x, v.y * s + offset.y, v.z * s + offset.z];

    // Slide the phone out from behind the chair. Measured from its current
    // bounds, so a remount with the cached scene leaves it where it is.
    const phoneNode = requireNode(scene, MODEL_NODES.phone);
    const phoneCenterX = boundsInModel(scene, phoneNode).getCenter(new Vector3()).x;
    phoneNode.position.x += (PHONE_PLACEMENT.centerX - offset.x) / s - phoneCenterX;

    const monitor = boundsInModel(scene, requireNode(scene, MODEL_NODES.monitorCenter));
    const phone = boundsInModel(scene, phoneNode);
    const pcCase = boundsInModel(scene, requireNode(scene, MODEL_NODES.pcCase));
    const chair = requireNode(scene, MODEL_NODES.chair);
    return {
      offset,
      screen: measureScreen(scene, requireNode(scene, MODEL_NODES.centerScreen), toDesk, s),
      board: measureScreen(scene, requireNode(scene, MODEL_NODES.boardSurface), toDesk, s),
      monitorBounds: { min: toDesk(monitor.min), max: toDesk(monitor.max) },
      // The phone lies face up with its top towards the monitor.
      phoneScreen: measureScreen(scene, requireNode(scene, MODEL_NODES.phoneScreen), toDesk, s, PHONE_AXES),
      phoneBounds: { min: toDesk(phone.min), max: toDesk(phone.max) },
      pcCaseCenter: toDesk(pcCase.getCenter(new Vector3())),
      chair,
      chairPosition: chair.position.clone(),
      chairYaw: chair.rotation.y,
    };
  }, [scene]);

  useLayoutEffect(() => {
    setLayout({
      screen: layout.screen,
      board: layout.board,
      monitorBounds: layout.monitorBounds,
      pcCaseCenter: layout.pcCaseCenter,
      phoneScreen: layout.phoneScreen,
      phoneBounds: layout.phoneBounds,
    });
  }, [layout, setLayout]);

  // The visitor pulls the chair out, turns it, then eases it back into place.
  // CameraRig writes progress first in the frame; all chair parts share this parent.
  useFrame(() => {
    const { phase, introProgress } = useExperience.getState();
    const p = phase === 'intro' ? introProgress : 0;
    const pull = easeInOutCubic(clamp((p - 0.22) / 0.22, 0, 1))
      * (1 - easeInOutCubic(clamp((p - 0.70) / 0.25, 0, 1)));
    layout.chair.position.copy(layout.chairPosition);
    layout.chair.position.x += pull * 0.06;
    layout.chair.position.z += pull * 0.43;
    layout.chair.rotation.y = layout.chairYaw + pull * 0.35;
  });

  useLayoutEffect(() => {
    scene.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      const materials: unknown[] = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        if (!(material instanceof MeshStandardMaterial)) continue;
        if (LED_MATERIALS.test(material.name)) {
          material.toneMapped = false;
          material.needsUpdate = true;
        }
        if (!(material instanceof MeshPhysicalMaterial) || material.transmission === 0) continue;
        material.transmission = 0;
        material.transparent = true;
        material.opacity = RENDER.glassOpacity;
        material.needsUpdate = true;
      }
    });
  }, [scene]);

  return (
    <group position={layout.offset} scale={MODEL_PLACEMENT.scale}>
      <primitive object={scene} />
    </group>
  );
}

function requireNode(root: Object3D, name: string): Object3D {
  const node = root.getObjectByName(name);
  if (!node) throw new Error(`Model is missing the "${name}" node. Re-export from Blender and run npm run model:check.`);
  return node;
}

/** Transform from `node`'s local space into `root`'s local space. */
function matrixInModel(root: Object3D, node: Object3D): Matrix4 {
  root.updateWorldMatrix(true, true);
  return root.matrixWorld.clone().invert().multiply(node.matrixWorld);
}

/** Model-space corners of every mesh's local bounding box under `node`. */
function cornersInModel(root: Object3D, node: Object3D): Vector3[] {
  const corners: Vector3[] = [];
  node.traverse((child) => {
    if (!(child instanceof Mesh)) return;
    child.geometry.computeBoundingBox();
    const box = child.geometry.boundingBox;
    if (!box) return;
    const m = matrixInModel(root, child);
    for (const x of [box.min.x, box.max.x])
      for (const y of [box.min.y, box.max.y])
        for (const z of [box.min.z, box.max.z]) corners.push(new Vector3(x, y, z).applyMatrix4(m));
  });
  return corners;
}

function boundsInModel(root: Object3D, node: Object3D): Box3 {
  return new Box3().setFromPoints(cornersInModel(root, node));
}

/** A display's own axes, in its node's local space. */
interface ScreenAxes {
  right: Vector3;
  up: Vector3;
  normal: Vector3;
}

/** Monitors and the board stand upright, facing +Z. */
const UPRIGHT_AXES: ScreenAxes = { right: new Vector3(1, 0, 0), up: new Vector3(0, 1, 0), normal: new Vector3(0, 0, 1) };
/** The phone lies flat facing +Y, its top (earpiece) towards -Z. */
const PHONE_AXES: ScreenAxes = { right: new Vector3(1, 0, 0), up: new Vector3(0, 0, -1), normal: new Vector3(0, 1, 0) };

/**
 * Measures a display in desk space along its own axes, so it stays correct if
 * it is ever rotated in Blender.
 */
function measureScreen(
  root: Object3D,
  node: Object3D,
  toDesk: (v: Vector3) => Vec3,
  scale: number,
  axes: ScreenAxes = UPRIGHT_AXES,
): ScreenRect {
  // decompose() rather than setFromRotationMatrix(): quantised meshes carry a scale.
  const quaternion = new Quaternion();
  matrixInModel(root, node).decompose(new Vector3(), quaternion, new Vector3());
  const right = axes.right.clone().applyQuaternion(quaternion);
  const up = axes.up.clone().applyQuaternion(quaternion);
  const normal = axes.normal.clone().applyQuaternion(quaternion);

  const corners = cornersInModel(root, node);
  const span = (axis: Vector3): [number, number] => {
    const values = corners.map((c) => c.dot(axis));
    return [Math.min(...values), Math.max(...values)];
  };
  const [r0, r1] = span(right);
  const [u0, u1] = span(up);
  const [, n1] = span(normal);
  // Centre of the panel's front face.
  const front = new Vector3()
    .addScaledVector(right, (r0 + r1) / 2)
    .addScaledVector(up, (u0 + u1) / 2)
    .addScaledVector(normal, n1);

  return {
    center: toDesk(front),
    normal: [normal.x, normal.y, normal.z],
    up: [up.x, up.y, up.z],
    width: (r1 - r0) * scale,
    height: (u1 - u0) * scale,
  };
}
