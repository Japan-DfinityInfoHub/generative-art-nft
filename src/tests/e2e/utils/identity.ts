import { Secp256k1KeyIdentity } from '@dfinity/identity';
import sha256 from 'sha256';
import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

export const parseIdentity = (keyPath: string) => {
  const rawKey = fs
    .readFileSync(path.join(__dirname, keyPath))
    .toString()
    .replace('-----BEGIN EC PRIVATE KEY-----', '')
    .replace('-----END EC PRIVATE KEY-----', '')
    .trim();

  //@ts-expect-error  Argument of type 'ArrayBufferLike' is not assignable to parameter of type 'Message'.ts(2769)
  const rawBuffer = Uint8Array.from(rawKey).buffer;
  //@ts-expect-error Argument of type 'ArrayBufferLike' is not assignable to parameter of type 'Message'.ts(2769)
  const privKey = Uint8Array.from(sha256(rawBuffer, { asBytes: true }));

  // Initialize an identity from the secret key
  return Secp256k1KeyIdentity.fromSecretKey(Uint8Array.from(privKey).buffer);
};
