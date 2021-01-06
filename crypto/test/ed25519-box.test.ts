import test from 'ava'
import { Keypair } from 'stellar-sdk';
import { deriveKey } from '../src/secretBox/ed25519-box'

test.only("derive key", (t) => {
  const alice = Keypair.fromSecret("SACSBRUH43EU4YBHK2UT4WOQKPIE4HLZPQBOIES7ZOAVMVCW5ZQRGVUZ")
  //GARXGMKIP5IAATQZOWF77G7PLOC54FZBS7CVB3GVYUYL46C3GHH3UF5A
  const bob = Keypair.fromSecret("SAAQ3OASEUGQQX6CRAWJTPZFAM6W2YOYBRIRNIYRUQY3QGGLFN4XYVRF")
  // address: GA3W4R77Z6YM2T3JJPOTZGTRIDAJQTCRX26QXSQZDJEZLBI7AJXUCDH4
  // raw: 010db812250d085fc2882c99bf25033d6d61d80c5116a311a431b818cb2b797c
console.log({raw: bob.rawSecretKey().toString("hex")})

  const derivedByAlice = deriveKey(alice.rawSecretKey(), bob.rawPublicKey())
  const derivedByBob = deriveKey(bob.rawSecretKey(), alice.rawPublicKey())
  // seed: '010db812250d085fc2882c99bf25033d6d61d80c5116a311a431b818cb2b797c'
  // hash:      '7d26df77f87437f12e910b4a440d02227d0c5f28bd328533fa139cb9fe1742f8383a8722db43cf18187b3a6ffdb23d1ace65a5d270cc4a40d1ee65d464e986ae'
  // afterHash: '7826df77f87437f12e910b4a440d02227d0c5f28bd328533fa139cb9fe174278383a8722db43cf18187b3a6ffdb23d1ace65a5d270cc4a40d1ee65d464e986ae'
  // scalar: '784217feb99c13fa338532bd285f0c7d22020d444a0b912ef13774f877df2678'
  // secret: 'bbeafe8cf8912ea4c8e49d4c53344ce5caaf9f9fb4c2501971d78b9450b5bc92'
  // derived: 'fedecc68f2c6be19b883b4ed0d8773a7d427f1f405559dfda44e26255cb9f60a'
  console.log({derivedByBob: derivedByBob.toString("hex")})
  console.log(derivedByAlice)
  console.log(derivedByBob)
  t.deepEqual(derivedByAlice, derivedByBob)
})
