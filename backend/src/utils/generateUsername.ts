/**
 * Generate a clean username from display name or email
 */
export function generateUsername(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .substring(0, 20)
    .replace(/^_+|_+$/g, '')
    || 'user';
}
