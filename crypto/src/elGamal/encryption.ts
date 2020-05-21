import { parseBigInt } from "./utils";
import { BigInteger as BigInt } from 'jsbn';
import * as Utils from "./utils";
import DecryptedValue from "./decryptedValue";
import EncryptedValue from "./encryptedValue";

export default class EncryptionElGamal {
    /**
     * Safe prime number.
     */
    p: BigInt;

    /**
     * Generator.
     */
    g: BigInt;

    /**
     * Public key.
     */
    y: BigInt;

    /**
     * Creates a new ElGamal instance.
     * @param {BigInt|string|number} p Safe prime number.
     * @param {BigInt|string|number} g Generator.
     * @param {BigInt|string|number} y Public key.
     */
    constructor(p: BigInt | string | number, g: BigInt | string | number, y: BigInt | string | number) {
        this.p = parseBigInt(p);
        this.g = parseBigInt(g);
        this.y = parseBigInt(y);
    }

    /**
     * Encrypts a message.
     * @param  m Piece of data to be encrypted, which must
     * be numerically smaller than `p`.
     * @param  [k] A secret number, chosen randomly in the
     * closed range `[1, p-2]`.
     * @returns {EncryptedValue}
     */
    encrypt(m: Buffer, k?: BigInt | string | number) {
        const tmpKey = k ? Utils.parseBigInt(k) : Utils.getRandomBigInt(
            BigInt.ONE,
            this.p.subtract(BigInt.ONE)
        );

        const mBi = new DecryptedValue(m).bi;
        const p = this.p;

        const a = this.g.modPow(tmpKey, p);
        const b = this.y.modPow(tmpKey, p).multiply(mBi).remainder(p);

        return new EncryptedValue(a, b);
    }

}