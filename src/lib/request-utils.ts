/**
 * Parses request body from different content types (JSON, form-data, urlencoded)
 * @param request - The incoming Request object
 * @returns Parsed body data or empty object if parsing fails
 */
export async function parseRequestBody<T = Record<string, any>>(request: Request): Promise<T> {
  const contentType = request.headers.get('content-type') || '';

  try {
    if (contentType.includes('application/json')) {
      return (await request.json()) as T;
    }

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await request.text();
      const params = new URLSearchParams(text);
      const result: Record<string, any> = {};
      params.forEach((value, key) => {
        result[key] = value;
      });
      return result as T;
    }

    // Default to form-data
    const formData = await request.formData();
    const result: Record<string, any> = {};
    formData.forEach((value, key) => {
      result[key] = value;
    });
    return result as T;
  } catch {
    return {} as T;
  }
}

/**
 * Extracts a string value from parsed body data
 * Ignores File objects to prevent "[object File]" string conversions
 */
export function getString(data: Record<string, any>, key: string): string | null {
  const value = data[key];
  if (typeof value === 'string') return value;
  if (value == null) return null;
  // Ignore File objects from multipart form-data
  if (typeof File !== 'undefined' && value instanceof File) return null;
  return String(value);
}

/**
 * Extracts a number value from parsed body data
 */
export function getNumber(data: Record<string, any>, key: string): number | null {
  const value = data[key];
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  }
  return null;
}
