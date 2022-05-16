import {
  generateTokenIdentifier,
  getSubAccount,
} from './ext'

describe('generateTokenIdentifier test', () => {
  it('Generate TokenIdentifier from canisterId and tokenIndex', async () => {
    const canisterId = 'rrkah-fqaaa-aaaaa-aaaaq-cai';
    const tokenIndex = 0;
    const tokenIdentifier = 'dyi3c-bqkor-uwiaa-aaaaa-aaaaa-eaqca-aaaaa-a';
    expect(generateTokenIdentifier(canisterId, tokenIndex)).toBe(tokenIdentifier);
  });
});

describe('getSubAccount test', () => {
  it('Generate SubAccount from passed index', async () => {
    const accountIndex = 257;
    const result = getSubAccount(accountIndex);
    const expected = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1]; // [u8; 32]
    expect(result.length).toBe(32);
    expect(result).toEqual(expected);
  });
});
