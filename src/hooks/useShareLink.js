import { useMemo } from 'react';
import { decodeSharePayload, encodeSharePayload } from '../lib/shareCodec';
import { shareStateSchema } from '../lib/schema';

export function useShareLink(payload) {
  const encoded = useMemo(() => encodeSharePayload(payload), [payload]);
  const link = `${window.location.origin}/#/t/${encoded}`;
  const tooLarge = encoded.length > 6000;
  return { link, tooLarge, encoded };
}

export function readShareFromHash() {
  const match = window.location.hash.match(/^#\/t\/(.+)$/);
  if (!match) return null;
  const decoded = decodeSharePayload(match[1]);
  if (!decoded) return { error: 'Could not decode shared timeline.' };
  const parsed = shareStateSchema.safeParse(decoded);
  if (!parsed.success) return { error: 'Shared link is invalid or outdated.' };
  return { data: parsed.data };
}
