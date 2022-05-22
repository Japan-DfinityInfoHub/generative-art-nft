import fetch from 'isomorphic-fetch';
import { IDL } from '@dfinity/candid';
import fs from 'fs';

declare module '../../declarations/GenerativeArtNFT/GenerativeArtNFT.did.js' {
  function idlFactory(): IDL.ServiceClass;
}
import {
  _SERVICE as GenerativeArtNFT,
  idlFactory,
} from '../../declarations/GenerativeArtNFT/GenerativeArtNFT.did.js';
import { curriedCreateActor } from '../../GenerativeArtNFT_assets/src/utils/createActor';
import { generateTokenIdentifier } from '../../GenerativeArtNFT_assets/src/utils/ext';
import localCanisterIds from '../../../.dfx/local/canister_ids.json';
const canisterId = localCanisterIds.GenerativeArtNFT.local;
import { parseIdentity } from './utils/identity';

// We don't import an actor from `../../declarations/GenerativeArtNFT/index.js`
// because it gives an error in jest running on GitHub Actions.
const createGenerativeArtNFTActor =
  curriedCreateActor<GenerativeArtNFT>(idlFactory)(canisterId);

const identity = parseIdentity('test-image-setter-ec-secp256k1-priv-key.pem');

const identityOptionOfImageSetter = {
  agentOptions: {
    identity,
    fetch,
    host: 'http://localhost:8000',
  },
};

const actorOfImageSetter = createGenerativeArtNFTActor(
  identityOptionOfImageSetter
);

describe('Image setting', () => {
  it('Set dummy_1.png', async () => {
    const image = fs.readFileSync('./src/dummyImages/dummy_1.png', {
      encoding: 'base64',
    });
    const res = await actorOfImageSetter.setTokenImage(1, image);
    expect(res).toStrictEqual({ ok: null });
  });
});

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
    expect(res.headers.get('Content-Type')).toBe('image/svg+xml');
  });

  it('Return token image even if an additional dummy query is specified', async () => {
    const tokenIndex = 1;
    const correctTokenId = generateTokenIdentifier(canisterId, tokenIndex);
    const res = await fetch(
      `http://localhost:8000?canisterId=${canisterId}&tokenid=${correctTokenId}&dummy=1`
    );
    const text = await res.text();
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/svg+xml');
  });
});
