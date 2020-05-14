import { BigInteger as BigInt } from 'jsbn';

/**
 * Stores an ElGamal-encrypted value.
 */
export default class EncryptedValue {
    constructor(readonly a: BigInt, readonly b: BigInt) {
    }

    /**
     * Performs homomorphic multiplication of the current and the given value.
     * @param encryptedValue Value to multiply the current value
     * with.
     */
    multiply(encryptedValue: EncryptedValue): EncryptedValue {
        return new EncryptedValue(
            this.a.multiply(encryptedValue.a),
            this.b.multiply(encryptedValue.b)
        );
    }
}