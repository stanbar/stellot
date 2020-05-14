import Promise from 'bluebird';
import crypto from 'crypto';
import { BigInteger as BigInt } from 'jsbn';

Promise.promisifyAll(crypto);

export const BIG_TWO = new BigInt('2');

/**
 * Trims a BigInt to a specific length.
 * @param  bi BigInt to be trimmed.
 * @param  bits Number of bits in the output.
 */
function trimBigInt(bi: BigInt, bits: number) {
    const trimLength = bi.bitLength() - bits;
    return trimLength > 0 ? bi.shiftRight(trimLength) : bi;
}

/**
 * Returns a random BigInt with the given amount of bits.
 * @param  bits Number of bits in the output.
 */
export async function getRandomNbitBigIntAsync(bits: number) {
    // Generate random bytes with the length of the range
    //@ts-ignore
    const buf = await crypto.randomBytesAsync(Math.ceil(bits / 8));
    const bi = new BigInt(buf.toString('hex'), 16);

    // Trim the result and then ensure that the highest bit is set
    return trimBigInt(bi, bits).setBit(bits - 1);
}

/**
 * Returns a random BigInt in the given range.
 * @param  min Minimum value (included).
 * @param  max Maximum value (excluded).
 */
export async function getRandomBigIntAsync(min: BigInt, max: BigInt) {
    const range = max.subtract(min).subtract(BigInt.ONE);

    let bi;
    do {
        // Generate random bytes with the length of the range
        //@ts-ignore
        const buf = await crypto.randomBytesAsync(Math.ceil(range.bitLength() / 8));

        // Offset the result by the minimum value
        bi = new BigInt(buf.toString('hex'), 16).add(min);
    } while (bi.compareTo(max) >= 0);

    // Return the result which satisfies the given range
    return bi;
}

/**
 * Returns a random prime BigInt value.
 * @param  bits Number of bits in the output.
 */
export async function getBigPrimeAsync(bits: number) {
    // Generate a random odd number with the given length
    let bi = (await getRandomNbitBigIntAsync(bits)).or(BigInt.ONE);

    //@ts-ignore
    while (!bi.isProbablePrime()) {
        bi = bi.add(BIG_TWO);
    }

    // Trim the result and then ensure that the highest bit is set
    return trimBigInt(bi, bits).setBit(bits - 1);
}

/**
 * Parses a BigInt.
 * @param  obj Object to be parsed.
 */
export function parseBigInt(obj: BigInt | string | number): BigInt {

    return obj instanceof Object ? obj : new BigInt(`${obj}`);
}