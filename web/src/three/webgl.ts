let supported: boolean | undefined;

/** Whether this browser can draw WebGL at all. Checked once. */
export function canUseWebGL(): boolean {
  if (supported === undefined) {
    try {
      const canvas = document.createElement("canvas");
      supported = (canvas.getContext("webgl2") ?? canvas.getContext("webgl")) !== null;
    } catch {
      supported = false;
    }
  }
  return supported;
}
