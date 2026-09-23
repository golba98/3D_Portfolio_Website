/** Facts about this website itself, shown in System Info and neofetch. */
export const siteInfo = {
  stack: ['React 19', 'TypeScript', 'Vite', 'Three.js', 'React Three Fiber', 'Framer Motion', 'Zustand'],
  model: {
    description: 'The desk is modelled in Blender and exported to glTF.',
    triangles: '≈119k',
    source: 'Blender scene “PC_Setup_Hero”',
  },
  sourceNote: 'A simulated desktop — nothing here runs real commands.',
} as const;
