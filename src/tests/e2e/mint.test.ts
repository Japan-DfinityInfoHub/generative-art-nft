import { Secp256k1KeyIdentity } from '@dfinity/identity';
import fetch from 'isomorphic-fetch';
import { IDL } from '@dfinity/candid';
import { Principal } from '@dfinity/principal';
import { generateTokenIdentifier, getSubAccount } from './utils/ext';

declare module '../../declarations/GenerativeArtNFT/GenerativeArtNFT.did.js' {
  function idlFactory(): IDL.ServiceClass;
}
import {
  User,
  SubAccount,
  MintRequest,
  BalanceRequest,
  TransferRequest,
  ApproveRequest,
  AllowanceRequest,
  TokenIdentifier,
  _SERVICE as GenerativeArtNFT,
  idlFactory,
} from '../../declarations/GenerativeArtNFT/GenerativeArtNFT.did.js';
import { curriedCreateActor } from './utils/createActor';
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
const userAlice: User = {
  principal: identityOptionOfAlice.agentOptions.identity.getPrincipal(),
};

const identityOptionOfBob = {
  agentOptions: {
    identity: Secp256k1KeyIdentity.generate(),
    fetch,
    host: 'http://localhost:8000',
  },
};
const actorOfBob = createGenerativeArtNFTActor(identityOptionOfBob);
const userBob: User = {
  principal: identityOptionOfBob.agentOptions.identity.getPrincipal(),
};

const identityOptionOfAnonymous = {
  agentOptions: {
    fetch,
    host: 'http://localhost:8000',
  },
};
const actorOfAnonymous = createGenerativeArtNFTActor(identityOptionOfAnonymous);

describe('NFT minting test', () => {
  let tokenNumberBeforeMinting: number;

  beforeAll(async () => {
    const tokensBeforeMinting = await actorOfAlice.getTokens();
    tokenNumberBeforeMinting = tokensBeforeMinting.length;
  });

  it('Alice can mint an NFT', async () => {
    const mintRequest: MintRequest = {
      to: userAlice,
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
      user: userAlice,
    };
    const res = await actorOfAlice.balance(balanceRequest);
    expect(res).toStrictEqual({
      ok: BigInt(1),
    });
  });

  it('The getTokenIndexOwnedByUser method returns tokenIndex', async () => {
    const user = userAlice;
    const res = await actorOfAlice.getTokenIndexOwnedByUser(user);
    expect(res).toStrictEqual([tokenNumberBeforeMinting]);
  });

  it('The number of tokens has been increased by 1', async () => {
    const tokensAfterMinting = await actorOfAlice.getTokens();
    const tokenNumberAfterMinting = tokensAfterMinting.length;
    expect(tokenNumberBeforeMinting + 1).toBe(tokenNumberAfterMinting);
  });
});

describe('NFT minting to others', () => {
  let tokenNumberBeforeMinting: number;

  beforeAll(async () => {
    const tokensBeforeMinting = await actorOfAlice.getTokens();
    tokenNumberBeforeMinting = tokensBeforeMinting.length;
  });

  it('Alice can mint an NFT to Bob', async () => {
    const mintRequest: MintRequest = {
      to: userBob,
      metadata: [],
    };
    const tokenIndex = await actorOfAlice.mintNFT(mintRequest);
    expect(tokenIndex).toBe(tokenNumberBeforeMinting);
  });

  it('Bob got the NFT', async () => {
    const tid: TokenIdentifier = generateTokenIdentifier(
      canisterId,
      tokenNumberBeforeMinting
    );
    const balanceRequest: BalanceRequest = {
      token: tid,
      user: userBob,
    };
    const res = await actorOfBob.balance(balanceRequest);
    expect(res).toStrictEqual({
      ok: BigInt(1),
    });
  });
});

describe('Anonymous NFT minting test', () => {
  const principal = Principal.anonymous();
  const anonymous: User = {
    principal,
  };

  it('Anonymous identity can not mint an NFT.', async () => {
    const mintRequest: MintRequest = {
      to: anonymous,
      metadata: [],
    };
    await expect(actorOfAnonymous.mintNFT(mintRequest)).rejects.toThrow();
  });
});

describe('NFT transfer test', () => {
  let tokenIndex: number;
  let tid: TokenIdentifier;

  beforeAll(async () => {
    const mintRequest: MintRequest = {
      to: userAlice,
      metadata: [],
    };
    tokenIndex = await actorOfAlice.mintNFT(mintRequest);
    tid = generateTokenIdentifier(canisterId, tokenIndex);
  });

  it("Bob doesn't have NFT whose owner is currently Alice", async () => {
    const balanceRequest: BalanceRequest = {
      token: tid,
      user: userBob,
    };
    const res = await actorOfBob.balance(balanceRequest);
    expect(res).toStrictEqual({
      ok: BigInt(0),
    });
  });

  it("Bob can't transfer NFT whose owner is currently Alice", async () => {
    const transferRequest: TransferRequest = {
      from: userAlice,
      to: userBob,
      token: tid,
      amount: BigInt(1),
      memo: [],
      notify: false,
      subaccount: [],
    };
    const res = await actorOfBob.transfer(transferRequest);
    expect(res).toEqual({
      err: {
        Unauthorized: expect.anything(),
      },
    });
  });

  it("Alice can't specify the wrong amount when transferring her NFT", async () => {
    const transferRequest: TransferRequest = {
      from: userAlice,
      to: userBob,
      token: tid,
      amount: BigInt(2),
      memo: [],
      notify: false,
      subaccount: [],
    };
    const res = await actorOfAlice.transfer(transferRequest);
    expect(res).toEqual({
      err: {
        Other: expect.anything(),
      },
    });
  });

  it('Alice can transfer her NFT to Bob', async () => {
    const transferRequest: TransferRequest = {
      from: userAlice,
      to: userBob,
      token: tid,
      amount: BigInt(1),
      memo: [],
      notify: false,
      subaccount: [],
    };
    const res = await actorOfAlice.transfer(transferRequest);
    expect(res).toEqual({
      ok: BigInt(1),
    });
  });

  it('Now Bob owns NFT transferred by Alice', async () => {
    const balanceRequest: BalanceRequest = {
      token: tid,
      user: userBob,
    };
    const res = await actorOfBob.balance(balanceRequest);
    expect(res).toStrictEqual({
      ok: BigInt(1),
    });
  });

  it("Alice doesn't own the NFT anymore", async () => {
    const balanceRequest: BalanceRequest = {
      token: tid,
      user: userAlice,
    };
    const res = await actorOfAlice.balance(balanceRequest);
    expect(res).toStrictEqual({
      ok: BigInt(0),
    });
  });
});

describe('Tests for approval methods', () => {
  let tokenIndex: number;
  let tid: TokenIdentifier;
  const accountIndex = 0;

  beforeAll(async () => {
    const mintRequest: MintRequest = {
      to: userAlice,
      metadata: [],
    };
    tokenIndex = await actorOfAlice.mintNFT(mintRequest);
    tid = generateTokenIdentifier(canisterId, tokenIndex);
  });

  it("Bob doesn't have an allowance yet", async () => {
    const allowanceRequest: AllowanceRequest = {
      token: tid,
      owner: userAlice,
      spender: userBob.principal,
    };
    const res = await actorOfAlice.allowance(allowanceRequest);
    expect(res).toStrictEqual({
      ok: BigInt(0),
    });
  });

  it('The allowance method returns an error when specifying an invalid owner', async () => {
    const allowanceRequest: AllowanceRequest = {
      token: tid,
      owner: userBob,
      spender: userBob.principal,
    };
    const res = await actorOfAlice.allowance(allowanceRequest);
    expect(res).toEqual({
      err: {
        Other: expect.anything(),
      },
    });
  });

  it('Alice can give approval to Bob', async () => {
    const subaccountOfAlice: SubAccount = getSubAccount(accountIndex);
    const approveRequest: ApproveRequest = {
      token: tid,
      subaccount: [subaccountOfAlice],
      allowance: BigInt(1),
      spender: userBob.principal,
    };
    // We don't check the response from `approve` function
    // because it returns nothing regardless of the success
    await actorOfAlice.approve(approveRequest);

    const allowanceRequest: AllowanceRequest = {
      token: tid,
      owner: userAlice,
      spender: userBob.principal,
    };
    const res = await actorOfAlice.allowance(allowanceRequest);
    expect(res).toStrictEqual({
      ok: BigInt(1),
    });
  });

  it("Bob can transfer Alice's NFT", async () => {
    const subaccountOfBob: SubAccount = getSubAccount(accountIndex);
    const transferRequest: TransferRequest = {
      from: userAlice,
      to: userBob,
      token: tid,
      amount: BigInt(1),
      memo: [],
      notify: false,
      subaccount: [subaccountOfBob],
    };
    const res = await actorOfBob.transfer(transferRequest);
    expect(res).toEqual({
      ok: BigInt(1),
    });
  });

  it('Now Bob owns NFT transferred by Alice', async () => {
    const balanceRequest: BalanceRequest = {
      token: tid,
      user: userBob,
    };
    const res = await actorOfBob.balance(balanceRequest);
    expect(res).toStrictEqual({
      ok: BigInt(1),
    });
  });

  it("Alice doesn't own the NFT anymore", async () => {
    const balanceRequest: BalanceRequest = {
      token: tid,
      user: userAlice,
    };
    const res = await actorOfAlice.balance(balanceRequest);
    expect(res).toStrictEqual({
      ok: BigInt(0),
    });
  });
});
