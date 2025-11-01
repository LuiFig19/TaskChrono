export function debounce<T extends (...args: any[]) => void>(fn: T, delayMs: number) {
  let handle: any;
  return (...args: Parameters<T>) => {
    clearTimeout(handle);
    handle = setTimeout(() => fn(...args), delayMs);
  };
}
