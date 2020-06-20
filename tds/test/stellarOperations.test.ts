import test from 'ava'
import { Keypair, TransactionBuilder, Server, Networks, Operation, BASE_FEE, Asset, Memo } from 'stellar-sdk'
import { createIssuerAccount, createVoteToken, createDistributionAndBallotAccount } from '../src/stellar'
import { randomBytes } from 'crypto';
import { encodeMemo, decodeMemo } from '@futuretense/secret-memo';

const masterKeypair = Keypair.fromSecret('SD2MDB4A23WMK2CEIS7SIBBCBECXFTUFQKEMCGJ3SZEJBBZ7XYBWMKYL')
const server = new Server('https://horizon-testnet.stellar.org');
const OPTIONS = { fee: BASE_FEE, networkPassphrase: Networks.TESTNET }

async function createVoterAccount(distributionKeypair: Keypair, voterKeypair: Keypair, voteToken: Asset, votesCap: number) {
    const issuer = await server.loadAccount(distributionKeypair.publicKey())
    const tx = new TransactionBuilder(issuer, OPTIONS)
        .addOperation(Operation.createAccount({
            destination: voterKeypair.publicKey(),
            startingBalance: '2',
        }))
        .addOperation(Operation.changeTrust({
            source: voterKeypair.publicKey(),
            asset: voteToken,
            limit: `${votesCap / (10 ** 7)}`,
        }))
        .addOperation(Operation.payment({
            destination: voterKeypair.publicKey(),
            asset: voteToken,
            amount: `${1 / (10 ** 7)}`,
        }))
        .setTimeout(30)
        .build()

    tx.sign(distributionKeypair, voterKeypair)
    return tx
}
async function createCastVoteTransaction(ballotBoxKeypair: Keypair, voterKeypair: Keypair, voteToken: Asset, votesCap: number) {
    const myAccount = await server.loadAccount(voterKeypair.publicKey())
    const tx = new TransactionBuilder(myAccount, OPTIONS)
        .addOperation(Operation.payment({
            destination: ballotBoxKeypair.publicKey(),
            asset: voteToken,
            amount: `${1 / (10 ** 7)}`,
        }))
        .setTimeout(30)
        .build()

    tx.sign(voterKeypair)
    return tx
}


test.serial.skip('stellar tx can contain create account and trust line op', async (t) => {
    const issuerKeypair = Keypair.random()
    const votesCap = 10
    const tdsStartingBalance = votesCap * 2

    await createIssuerAccount(masterKeypair, issuerKeypair, tdsStartingBalance)

    const voteToken = createVoteToken(issuerKeypair.publicKey(), randomBytes(20).toString('hex'))
    console.log('created vote token', voteToken)
    const [distributionKeypair, ballotBoxKeypair] =
        await createDistributionAndBallotAccount(issuerKeypair, votesCap, voteToken, tdsStartingBalance)

    const voterKeypair = Keypair.random()

    try {
        await (async () => {
            const tx = await createVoterAccount(distributionKeypair, voterKeypair, voteToken, votesCap)
            // possible use channel accounts
            const res = await server.submitTransaction(tx)
            t.true(!!res.hash)
        })()
        await (async () => {
            const tx = await createCastVoteTransaction(ballotBoxKeypair, voterKeypair, voteToken, votesCap)
            const res = await server.submitTransaction(tx)
            t.true(!!res.hash)
        })()
    } catch (e) {
        console.log({
            extras: e.response.data.extras,
            operations: e.response.data.extras.result_codes.operations
        })
        t.fail()
    }
});

test.serial.skip('send encrypted message from voter to ballotbox using secret-box', async (t) => {
    const voterKeypair = Keypair.random()
    const ballotBox = Keypair.random()
    const encryptionKeys = Keypair.random()

    try {
        await createIssuerAccount(masterKeypair, voterKeypair, 1)
        await createIssuerAccount(masterKeypair, ballotBox, 1)
    } catch (e) {
        console.log({
            extras: e.response.data.extras,
            operations: e.response.data.extras.result_codes.operations
        })
        t.fail()
    }
    const voterAccount = await server.loadAccount(voterKeypair.publicKey())

    const clearText = 'my ciphertext'
    const memo = Memo.text(clearText)
    const secret = await encodeMemo(voterAccount.sequenceNumber(), voterKeypair, encryptionKeys.publicKey(), memo);

    // const tx = new TransactionBuilder(voterAccount, OPTIONS)
    //     .addMemo(secret)
    //     .addOperation(Operation.payment({
    //         destination: ballotBox.publicKey(),
    //         asset: Asset.native(),
    //         amount: `${1 / (10 ** 7)}`,
    //     }))

    const decryptedMemoPromise = await decodeMemo(voterAccount.sequenceNumber() + 1, encryptionKeys, voterKeypair.publicKey(), secret);
    console.log(decryptedMemoPromise!.value!.toString())
    t.true(!!decryptedMemoPromise)
})