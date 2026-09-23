/**
 * The machine behind the desk model. The previous site never listed hardware,
 * so only facts it states are filled in; every `null` is a slot to fill in
 * later. Unset rows are hidden from visitors (System Info, neofetch, Files).
 */
export interface HardwareSpec {
  label: string;
  value: string | null;
  /** Where the value comes from, so it stays checkable. */
  source?: string;
}

export interface Hardware {
  hostname: string;
  user: string;
  os: HardwareSpec;
  kernel: HardwareSpec;
  desktop: HardwareSpec;
  cpu: HardwareSpec;
  gpu: HardwareSpec;
  gpuMemory: HardwareSpec;
  memory: HardwareSpec;
  storage: HardwareSpec;
  motherboard: HardwareSpec;
  cooling: HardwareSpec;
  case: HardwareSpec;
  displays: HardwareSpec;
  keyboard: HardwareSpec;
  mouse: HardwareSpec;
}

export const hardware: Hardware = {
  hostname: 'fedora',
  user: 'jordan',
  os: { label: 'OS', value: 'Fedora Linux', source: 'Previous site: "I run Fedora."' },
  kernel: { label: 'Kernel', value: null },
  desktop: { label: 'Desktop', value: null },
  cpu: { label: 'CPU', value: null },
  gpu: { label: 'GPU', value: null },
  gpuMemory: { label: 'GPU memory', value: '16 GB', source: 'Previous site: Codexa "trained from scratch on one 16 GB GPU"' },
  memory: { label: 'Memory', value: null },
  storage: { label: 'Storage', value: null },
  motherboard: { label: 'Motherboard', value: null },
  cooling: { label: 'Cooling', value: null },
  case: { label: 'Case', value: null },
  displays: { label: 'Displays', value: null },
  keyboard: { label: 'Keyboard', value: null },
  mouse: { label: 'Mouse', value: null },
};

type SpecKey = { [K in keyof Hardware]: Hardware[K] extends HardwareSpec ? K : never }[keyof Hardware];

/** Display order for System Info and neofetch. */
export const hardwareOrder: readonly SpecKey[] = [
  'os',
  'kernel',
  'desktop',
  'cpu',
  'gpu',
  'gpuMemory',
  'memory',
  'storage',
  'motherboard',
  'cooling',
  'case',
  'displays',
  'keyboard',
  'mouse',
];

/** Only the specs that have a value. */
export function knownHardware(): HardwareSpec[] {
  return hardwareOrder.map((key) => hardware[key]).filter((spec) => spec.value !== null);
}
