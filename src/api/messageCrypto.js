const encoder = new TextEncoder();
const decoder = new TextDecoder();

const bytesToBase64 = (bytes) => {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
};

const base64ToBytes = (base64) => {
  const binary = atob(base64);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
};

const getKeyMaterial = async (conversationId) => {
  const secret = import.meta.env.VITE_MESSAGE_ENCRYPTION_SECRET || window.location.origin;
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(`${secret}:${conversationId}`));
  return crypto.subtle.importKey('raw', digest, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
};

export const encryptMessage = async (conversationId, content) => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getKeyMaterial(conversationId);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(content)
  );

  return JSON.stringify({
    v: 1,
    alg: 'AES-GCM',
    iv: bytesToBase64(iv),
    data: bytesToBase64(new Uint8Array(encrypted)),
  });
};

export const decryptMessage = async (conversationId, content) => {
  if (!content) return '';

  try {
    const payload = JSON.parse(content);
    if (!payload?.iv || !payload?.data) return content;

    const key = await getKeyMaterial(conversationId);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: base64ToBytes(payload.iv) },
      key,
      base64ToBytes(payload.data)
    );

    return decoder.decode(decrypted);
  } catch {
    return content;
  }
};
