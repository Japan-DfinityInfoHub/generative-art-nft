/**
 * @jest-environment node
 */

import fetch from 'isomorphic-fetch';
import { generateTokenIdentifier } from '../../GenerativeArtNFT_assets/src/utils/ext';
import localCanisterIds from '../../../.dfx/local/canister_ids.json';
const canisterId = localCanisterIds.GenerativeArtNFT.local;

describe('Http call', () => {
  it('Request to the root path should return a text', async () => {
    const res = await fetch(`http://localhost:8000?canisterId=${canisterId}`);
    const text = await res.text();
    expect(res.status).toBe(200);
    expect(text).toBe('Generative Art NFT');
  });

  it('Return invalid token when specifying a wrong token id', async () => {
    const wrongTokenId = 'm3uuh-zykor-uwiaa-aaaaa-beaag-maqca-aaaos-q';
    const res = await fetch(
      `http://localhost:8000?canisterId=${canisterId}&tokenid=${wrongTokenId}`
    );
    const text = await res.text();
    expect(res.status).toBe(404);
    expect(text).toBe(`Invalid token ${wrongTokenId}`);
  });

  it('Return token image when specifying a correct token id', async () => {
    const tokenIndex = 1;
    const correctTokenId = generateTokenIdentifier(canisterId, tokenIndex);
    const res = await fetch(
      `http://localhost:8000?canisterId=${canisterId}&tokenid=${correctTokenId}`
    );
    const text = await res.text();
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/png');
  });

  it('Return token image even if an additional dummy query is specified', async () => {
    const tokenIndex = 1;
    const correctTokenId = generateTokenIdentifier(canisterId, tokenIndex);
    const res = await fetch(
      `http://localhost:8000?canisterId=${canisterId}&tokenid=${correctTokenId}&dummy=1`
    );
    const text = await res.text();
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/png');
  });
});
