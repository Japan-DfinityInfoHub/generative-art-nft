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
import { curriedCreateActor } from '../tests/e2e/utils/createActor.js';
import { generateTokenIdentifier } from '../tests/e2e/utils/ext';
import localCanisterIds from '../../.dfx/local/canister_ids.json';
const canisterId = localCanisterIds.GenerativeArtNFT.local;
import { parseIdentity } from '../tests/e2e/utils/identity.js';

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

console.log('hello');
