/** Short public request codes like wireframe "#5631" */
export function makeRequestCode() {
  const n = Math.floor(1000 + Math.random() * 9000);
  return String(n);
}

export function formatRequestCode(code: string) {
  return `#${code}`;
}
