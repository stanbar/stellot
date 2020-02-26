const L = new Float64Array([
  0xed,
  0xd3,
  0xf5,
  0x5c,
  0x1a,
  0x63,
  0x12,
  0x58,
  0xd6,
  0x9c,
  0xf7,
  0xa2,
  0xde,
  0xf9,
  0xde,
  0x14,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0x10,
])

function modL(r, x) {
  let carry
  let i
  let j
  let k
  for (i = 63; i >= 32; i -= 1) {
    carry = 0
    for (j = i - 32, k = i - 12; j < k; j += 1) {
      x[j] += carry - 16 * x[i] * L[j - (i - 32)]
      carry = Math.floor((x[j] + 128) / 256)
      x[j] -= carry * 256
    }
    x[j] += carry
    x[i] = 0
  }
  carry = 0
  for (j = 0; j < 32; j += 1) {
    x[j] += carry - (x[31] >> 4) * L[j]
    carry = x[j] >> 8
    x[j] &= 255
  }
  for (j = 0; j < 32; j += 1) x[j] -= carry * L[j]
  for (i = 0; i < 32; i += 1) {
    x[i + 1] += x[i] >> 8
    r[i] = x[i] & 255
  }
}

function reduce(r) {
  const x = new Float64Array(64)
  let i
  for (i = 0; i < 64; i += 1) x[i] = r[i]
  for (i = 0; i < 64; i += 1) r[i] = 0
  modL(r, x)
}

const gf = init => {
  let i
  const r = new Float64Array(16)
  if (init) for (i = 0; i < init.length; i += 1) r[i] = init[i]
  return r
}

function cryptoHash(out, m, n) {
  let h = new Uint8Array(64)
  let x = new Uint8Array(256)
  let i
  let b = n

  for (i = 0; i < 64; i++) h[i] = iv[i]

  crypto_hashblocks(h, m, n)
  n %= 128

  for (i = 0; i < 256; i++) x[i] = 0
  for (i = 0; i < n; i++) x[i] = m[b - n + i]
  x[n] = 128

  n = 256 - 128 * (n < 112 ? 1 : 0)
  x[n - 9] = 0
  ts64(x, n - 8, new u64((b / 0x20000000) | 0, b << 3))
  crypto_hashblocks(h, x, n)

  for (i = 0; i < 64; i++) out[i] = h[i]

  return 0
}

function crypto_sign(signedMsg, msg, msgLength, secretKey) {
  const d = new Uint8Array(64)
  const h = new Uint8Array(64)
  const r = new Uint8Array(64)
  let i
  let j
  const x = new Float64Array(64)
  const p = [gf(), gf(), gf(), gf()]

  cryptoHash(d, secretKey, 32)
  d[0] &= 248
  d[31] &= 127
  d[31] |= 64

  let smlen = msgLength + 64
  for (i = 0; i < msgLength; i += 1) signedMsg[64 + i] = msg[i]
  for (i = 0; i < 32; i += 1) signedMsg[32 + i] = d[32 + i]

  cryptoHash(r, signedMsg.subarray(32), msgLength + 32)
  reduce(r)
  scalarbase(p, r)
  pack(signedMsg, p)

  for (i = 32; i < 64; i += 1) signedMsg[i] = secretKey[i]
  cryptoHash(h, signedMsg, msgLength + 64)
  reduce(h)

  for (i = 0; i < 64; i += 1) x[i] = 0
  for (i = 0; i < 32; i += 1) x[i] = r[i]
  for (i = 0; i < 32; i += 1) {
    for (j = 0; j < 32; j += 1) {
      x[i + j] += h[i] * d[j]
    }
  }

  modL(signedMsg.subarray(32), x)
  return smlen
}

const cryptoSignSecretKeyBytesLength = 64
const cryptoSignBytesLength = 64

function blindSign(msg, secretKey) {
  if (secretKey.length !== cryptoSignSecretKeyBytesLength) {
    throw new Error('bad secret key size')
  }
  const signedMsg = new Uint8Array(cryptoSignBytesLength + msg.length)
  crypto_sign(signedMsg, msg, msg.length, secretKey)
  return signedMsg
}
