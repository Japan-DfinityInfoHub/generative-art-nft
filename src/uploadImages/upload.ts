import fetch from 'isomorphic-fetch';
import { IDL } from '@dfinity/candid';
import fs from 'fs';

declare module '../declarations/GenerativeArtNFT/GenerativeArtNFT.did.js' {
  function idlFactory(): IDL.ServiceClass;
}

import {
  _SERVICE as GenerativeArtNFT,
  idlFactory,
} from '../declarations/GenerativeArtNFT/GenerativeArtNFT.did.js';
import { curriedCreateActor } from '../tests/e2e/utils/createActor';
import localCanisterIds from '../../.dfx/local/canister_ids.json';
const canisterId = localCanisterIds.GenerativeArtNFT.local;
import { parseIdentity } from '../tests/e2e/utils/identity.js';
import { generateTokenIdentifier } from '../tests/e2e/utils/ext';

// We don't import an actor from `../declarations/GenerativeArtNFT/index.js`
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

const range = (start: number, end: number) =>
  [...Array(end - start + 1)].map((_, idx) => start + idx);

export const upload = async (
  startIndex: number,
  endIndex: number,
  imagesSaveDir: string
) => {
  range(startIndex, endIndex).forEach(async (i: number) => {
    const tokenid = generateTokenIdentifier(canisterId, i);

    console.log(
      `Uploading image No. ${i} that is available at http://${canisterId}.localhost:8000?tokenid=${tokenid} ...`
    );
    const image = fs.readFileSync(`${imagesSaveDir}/${i}.png`, {
      encoding: 'base64',
    });
    const res = await actorOfImageSetter.setTokenImage(i, image);
    if ('err' in res) {
      throw new Error(JSON.stringify(res.err));
    }
  });
};
