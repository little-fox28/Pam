import { z } from 'zod';

const schema = z.object({
  // Backend base URL. Optional until the API exists; becomes required later.
  EXPO_PUBLIC_API_URL: z.url().optional(),
});

// Expo only inlines `process.env.EXPO_PUBLIC_*` when referenced statically,
// so each variable is listed explicitly instead of passing `process.env`.
const parsed = schema.safeParse({
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL || undefined,
});

if (!parsed.success) {
  throw new Error(`Invalid environment configuration:\n${z.prettifyError(parsed.error)}`);
}

export const env = parsed.data;

