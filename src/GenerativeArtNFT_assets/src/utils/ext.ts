import { Principal } from '@dfinity/principal';

export const generateTokenIdentifier = (
  principal: string,
  index: number
): string => {
  const padding = Buffer.from('\x0Atid');
  const array = new Uint8Array([
    ...padding,
    ...Principal.fromText(principal).toUint8Array(),
    ...numberTo32bits(index),
  ]);
  return Principal.fromUint8Array(array).toText();
};

export const getSubAccount = (index: number): number[] => {
  return Array(28).fill(0).concat(numberTo32bits(index));
};

const numberTo32bits = (num: number) => {
  let b = new ArrayBuffer(4);
  new DataView(b).setUint32(0, num);
  return Array.from(new Uint8Array(b));
};
