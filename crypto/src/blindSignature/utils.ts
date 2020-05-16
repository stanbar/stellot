
import BN from 'bn.js'
import { rand } from 'elliptic'

export function randomScalar() {
  return new BN(rand(32))
}

const base64abc = (() => {
  const abc = [];
  const A = 'A'.charCodeAt(0);
  const a = 'a'.charCodeAt(0);
  const n = '0'.charCodeAt(0);
  for (let i = 0; i < 26; i += 1) {
    abc.push(String.fromCharCode(A + i));
  }
  for (let i = 0; i < 26; i += 1) {
    abc.push(String.fromCharCode(a + i));
  }
  for (let i = 0; i < 10; i += 1) {
    abc.push(String.fromCharCode(n + i));
  }
  abc.push('+');
  abc.push('/');
  return abc;
})();

export function bytesToBase64(bytes: any) { /* eslint-disable no-bitwise */
  let result = '';
  let i;
  const l = bytes.length;
  for (i = 2; i < l; i += 3) {
    result += base64abc[bytes[i - 2] >> 2];
    result += base64abc[((bytes[i - 2] & 0x03) << 4) | (bytes[i - 1] >> 4)];
    result += base64abc[((bytes[i - 1] & 0x0F) << 2) | (bytes[i] >> 6)];
    result += base64abc[bytes[i] & 0x3F];
  }
  if (i === l + 1) { // 1 octet missing
    result += base64abc[bytes[i - 2] >> 2];
    result += base64abc[(bytes[i - 2] & 0x03) << 4];
    result += '==';
  }
  if (i === l) { // 2 octets missing
    result += base64abc[bytes[i - 2] >> 2];
    result += base64abc[((bytes[i - 2] & 0x03) << 4) | (bytes[i - 1] >> 4)];
    result += base64abc[(bytes[i - 1] & 0x0F) << 2];
    result += '=';
  }
  return result;
}