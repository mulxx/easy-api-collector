import { AppConfig } from './StorageService';

export class MaskingUtils {
  static maskHeaders(
    headers: Record<string, string> | undefined,
    config: AppConfig
  ): Record<string, string> | undefined {
    if (!headers || !config.maskingEnabled) return headers;
    const keysToMask = config.maskingKeys.map((k) => k.toLowerCase());

    const masked: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
      if (keysToMask.includes(key.toLowerCase())) {
        masked[key] = '***MASKED***';
      } else {
        masked[key] = value;
      }
    }
    return masked;
  }

  static maskJsonInfo(obj: unknown, keysToMask: string[]): unknown {
    if (!obj || typeof obj !== 'object') return obj;

    // Process Arrays
    if (Array.isArray(obj)) {
      return obj.map((item) => this.maskJsonInfo(item, keysToMask));
    }

    const lowerKeys = keysToMask.map((k) => k.toLowerCase());
    const newObj: Record<string, unknown> = {};

    for (const key in obj as Record<string, unknown>) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (lowerKeys.includes(key.toLowerCase())) {
          newObj[key] = '***MASKED***';
        } else {
          newObj[key] = this.maskJsonInfo((obj as Record<string, unknown>)[key], keysToMask);
        }
      }
    }
    return newObj;
  }

  static maskPayload(
    payload: string | null | undefined,
    config: AppConfig
  ): string | null | undefined {
    if (!payload || !config.maskingEnabled) return payload;
    try {
      // Trying to parse payload as JSON
      const parsed = JSON.parse(payload);
      return JSON.stringify(this.maskJsonInfo(parsed, config.maskingKeys));
    } catch {
      // If it's not JSON, return as is (could be urlencoded or plain text)
      // A more advanced masking could employ regex replace for strings
      return payload;
    }
  }
}
