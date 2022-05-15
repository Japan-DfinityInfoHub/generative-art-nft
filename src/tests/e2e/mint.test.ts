import { Secp256k1KeyIdentity } from '@dfinity/identity';
import fetch from 'isomorphic-fetch';
import { IDL } from '@dfinity/candid';
import { Principal } from '@dfinity/principal';
import { generateTokenIdentifier } from '../../GenerativeArtNFT_assets/src/utils/ext';

declare module '../../declarations/GenerativeArtNFT/GenerativeArtNFT.did.js' {
  function idlFactory(): IDL.ServiceClass;
}
import {
  User,
  MintRequest,
  BalanceRequest,
  TokenIdentifier,
  _SERVICE as GenerativeArtNFT,
  idlFactory,
} from '../../declarations/GenerativeArtNFT/GenerativeArtNFT.did.js';
import { curriedCreateActor } from '../../GenerativeArtNFT_assets/src/utils/createActor';
import localCanisterIds from '../../../.dfx/local/canister_ids.json';
const canisterId = localCanisterIds.GenerativeArtNFT.local;

// We don't import an actor from `../../declarations/GenerativeArtNFT/index.js`
// because it gives an error in jest running on GitHub Actions.
const createGenerativeArtNFTActor =
  curriedCreateActor<GenerativeArtNFT>(idlFactory)(canisterId);

const identityOptionOfAlice = {
  agentOptions: {
    identity: Secp256k1KeyIdentity.generate(),
    fetch,
    host: 'http://localhost:8000',
  },
};
const actorOfAlice = createGenerativeArtNFTActor(identityOptionOfAlice);

const identityOptionOfAnonymous = {
  agentOptions: {
    fetch,
    host: 'http://localhost:8000',
  },
};
const actorOfAnonymous = createGenerativeArtNFTActor(identityOptionOfAnonymous);

describe('NFT minting test', () => {
  let tokenNumberBeforeMinting: number;

  const principal = identityOptionOfAlice.agentOptions.identity.getPrincipal();
  const alice: User = {
    principal,
  };

  beforeAll(async () => {
    const tokensBeforeMinting = await actorOfAlice.getTokens();
    tokenNumberBeforeMinting = tokensBeforeMinting.length;
  });

  it('Alice can mint a NFT', async () => {
    const mintRequest: MintRequest = {
      to: alice,
      metadata: [],
    };
    const tokenIndex = await actorOfAlice.mintNFT(mintRequest);
    expect(tokenIndex).toBe(tokenNumberBeforeMinting);
  });

  it('Alice has her NFT', async () => {
    const tid: TokenIdentifier = generateTokenIdentifier(
      canisterId,
      tokenNumberBeforeMinting
    );
    const balanceRequest: BalanceRequest = {
      token: tid,
      user: alice,
    };
    const res = await actorOfAlice.balance(balanceRequest);
    expect(res).toStrictEqual({
      ok: BigInt(1),
    });
  });

  it('Number of tokens has been increased by 1', async () => {
    const tokensAfterMinting = await actorOfAlice.getTokens();
    const tokenNumberAfterMinting = tokensAfterMinting.length;
    expect(tokenNumberBeforeMinting + 1).toBe(tokenNumberAfterMinting);
  });
});

describe('Anonymous NFT minting test', () => {
  const principal = Principal.anonymous();
  const anonymous: User = {
    principal,
  };

  it('Anomymous identity can not mint a NFT.', async () => {
    const mintRequest: MintRequest = {
      to: anonymous,
      metadata: [],
    };
    await expect(actorOfAnonymous.mintNFT(mintRequest)).rejects.toThrow();
  });
});
