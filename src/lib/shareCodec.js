import pako from 'pako';

function toBase64Url(uint8) {
  const b64 = btoa(String.fromCharCode(...uint8));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str) {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  const bin = atob(padded);
  return Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
}

export function encodeSharePayload(payload) {
  const text = JSON.stringify(payload);
  const compressed = pako.deflate(text);
  return toBase64Url(compressed);
}

export function decodeSharePayload(encoded) {
  try {
    const bytes = fromBase64Url(encoded);
    const text = pako.inflate(bytes, { to: 'string' });
    return JSON.parse(text);
  } catch {
    return null;
  }
}
