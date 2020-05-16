import { BigInteger as BigInt } from 'jsbn';

/**
 * Stores an ElGamal-encrypted value.
 */
export default class EncryptedValue {
    readonly a: BigInt

    readonly b: BigInt

    constructor(a: string | number | BigInt, b: string | number | BigInt) {
        switch (typeof a) {
            case 'string':
                this.a = new BigInt(new Buffer(a).toString('hex'), 16);
                break;
            case 'number':
                this.a = new BigInt(`${a}`);
                break;
            default:
                this.a = a
        }
        switch (typeof b) {
            case 'string':
                this.b = new BigInt(new Buffer(b).toString('hex'), 16);
                break;
            case 'number':
                this.b = new BigInt(`${b}`);
                break;
            default:
                this.b = b
        }
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