import { useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { CanvasTexture, SRGBColorSpace } from 'three';
import { POEM_PAPER } from '../../config/scene';
import { POEM } from '../../data/poem';

/** Locally painted paper and lettering: no image service or remote font requests. */
export function usePoemTextures() {
  const maxAnisotropy = useThree((s) => s.gl.capabilities.getMaxAnisotropy());
  const maxTextureSize = useThree((s) => s.gl.capabilities.maxTextureSize);
  const textures = useMemo(() => {
    const makeTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(Math.min(POEM_PAPER.textureWidth, maxTextureSize * POEM_PAPER.width / POEM_PAPER.height));
      canvas.height = Math.round(canvas.width * POEM_PAPER.height / POEM_PAPER.width);
      const texture = new CanvasTexture(canvas);
      texture.colorSpace = SRGBColorSpace;
      texture.anisotropy = Math.min(8, maxAnisotropy);
      return texture;
    };
    return { blank: makeTexture(), written: makeTexture() };
  }, [maxAnisotropy, maxTextureSize]);

  useEffect(() => {
    let cancelled = false;
    const draw = () => {
      const paper = textures.blank.image as HTMLCanvasElement;
      const ctx = paper.getContext('2d');
      const written = textures.written.image as HTMLCanvasElement;
      const ink = written.getContext('2d');
      if (!ctx || !ink) return;
      const { width, height } = paper;
      ctx.fillStyle = POEM_PAPER.color;
      ctx.fillRect(0, 0, width, height);
      const wash = ctx.createLinearGradient(0, 0, width, height);
      wash.addColorStop(0, '#fffaf022');
      wash.addColorStop(0.6, '#f4ebd700');
      wash.addColorStop(1, '#b6a58426');
      ctx.fillStyle = wash;
      ctx.fillRect(0, 0, width, height);
      // Deterministic fibres; redraws and StrictMode remounts keep the same sheet.
      let seed = 404;
      const random = () => ((seed = Math.imul(seed, 1664525) + 1013904223 | 0) >>> 0) / 4294967296;
      ctx.fillStyle = '#7564480b';
      for (let i = 0; i < 8000; i++) ctx.fillRect(random() * width, random() * height, 1 + random() * 3, 1);
      ink.clearRect(0, 0, width, height);
      ink.drawImage(paper, 0, 0);
      ink.fillStyle = POEM_PAPER.ink;
      const fontSize = width * 0.039;
      ink.font = `400 ${fontSize}px ${POEM_PAPER.fontFamily}, cursive`;
      ink.textBaseline = 'top';
      const margin = width * 0.085;
      let y = height * 0.085;
      for (const line of POEM.split('\n')) {
        if (!line) { y += fontSize * 0.8; continue; }
        let current = '';
        for (const word of line.split(' ')) {
          const next = current ? `${current} ${word}` : word;
          if (current && ink.measureText(next).width > width - margin * 2) {
            ink.fillText(current, margin, y);
            y += fontSize * 1.45;
            current = word;
          } else current = next;
        }
        ink.fillText(current, margin, y);
        y += fontSize * 1.45;
      }
      textures.blank.needsUpdate = true;
      textures.written.needsUpdate = true;
    };
    draw();
    void document.fonts.load(`400 48px ${POEM_PAPER.fontFamily}`).then(() => {
      if (!cancelled) draw();
    }).catch(() => undefined);
    return () => {
      cancelled = true;
      textures.blank.dispose();
      textures.written.dispose();
    };
  }, [textures]);

  return textures;
}
