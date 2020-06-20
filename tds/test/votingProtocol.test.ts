import test, { ExecutionContext } from 'ava'
import { Keypair, TransactionBuilder, Server, Networks, Operation, BASE_FEE, Asset, Memo, Transaction, MemoType } from 'stellar-sdk'
import { createIssuerAccount, createVoteToken, createDistributionAndBallotAccount } from '../src/stellar'
import { randomBytes } from 'crypto';
import { encodeMemo as encryptMemo } from '../src/secretMemo'
import { encodeMemo } from '../src/utils'
import { ed25519, VoterSession, SignerSession } from '@stellot/crypto'
import jwt from 'jsonwebtoken';
import BN from 'bn.js';

const masterKeypair = Keypair.fromSecret('SAC34ZEECSNNHLWKG66VTU3YKTGCHEVW5423NBNP5PXH6XFTVBQNJBQ6')
const server = new Server('https://horizon-testnet.stellar.org');
const OPTIONS = { fee: BASE_FEE, networkPassphrase: Networks.TESTNET }
const VOTING_ID = 'dean election pg 2021'
const USER_ID = 'asdfzxvccvbndfghrtyu123456'
const AS_KEY = "it should be asynchronious es256 keys"

function AS() {

    const obtainAuthenticationToken = () => jwt.sign(
        { userId: USER_ID, votingId: VOTING_ID },
        AS_KEY,
        { audience: 'Stellot', issuer: 'Stellot' }

    )
    return { obtainAuthenticationToken }
}

function Voter(t: ExecutionContext, tdsBlindSigPublicKey: Buffer, nonce: Buffer) {
    const voterSession = new VoterSession(tdsBlindSigPublicKey, nonce);
    const keypair = Keypair.random()

    console.log(tdsBlindSigPublicKey)
    const generateMessage = () => Buffer.concat([
        Buffer.from(tdsBlindSigPublicKey),
        Buffer.from(VOTING_ID) // user-generated id, it will be used by TDS to identify the user
    ])
    const getChallenge = (message: Buffer) => voterSession.challenge(message)
    const signature = (blindedSignature: BN) => voterSession.signature(blindedSignature)
    const createAccountTransaction = async (tdsStellarPublicKey: string, voteToken: Asset, votesCap: number): Promise<Transaction> => {
        const tdsAccount = await server.loadAccount(tdsStellarPublicKey)

        // For better scalability it should go through channel account 
        const tx = new TransactionBuilder(tdsAccount, OPTIONS)
            .addOperation(Operation.createAccount({
                destination: keypair.publicKey(),
                startingBalance: '2',
            }))
            .addOperation(Operation.changeTrust({
                source: keypair.publicKey(),
                asset: voteToken,
                limit: `${votesCap / (10 ** 7)}`,
            }))
            .addOperation(Operation.payment({
                destination: keypair.publicKey(),
                asset: voteToken,
                amount: `${1 / (10 ** 7)}`,
            }))
            .setTimeout(30)
            .build()

        tx.sign(keypair)
        return tx
    }

    const publishAccountTransaction = (tx: Transaction) => server.submitTransaction(tx)

    const createEncodedMemo = (voteOption: number): Memo<MemoType.Hash> => Memo.hash(encodeMemo(voteOption).toString('hex'))

    const publishVoteTransaction = async (memo: Memo<MemoType.Hash>, voteToken: Asset, mergePublicKey: string, ballotBoxPublicKey: string, encryptionKey: string) => {
        const account = await server.loadAccount(keypair.publicKey())
        const encryptedMemo = await encryptMemo(account.sequenceNumber(), keypair, encryptionKey, memo)
        t.deepEqual(encryptedMemo, await encryptMemo(account.sequenceNumber(), keypair, encryptionKey, memo))

        const tx = new TransactionBuilder(account, { ...OPTIONS, memo: encryptedMemo })
            .addOperation(Operation.payment({
                destination: ballotBoxPublicKey,
                asset: voteToken,
                amount: `${1 / (10 ** 7)}`,
            }))
            .addOperation(Operation.changeTrust({
                asset: voteToken,
                limit: '0',
            }))
            .addOperation(Operation.accountMerge({
                destination: mergePublicKey,
            }))
            .setTimeout(30)
            .build()
        tx.sign(keypair)
        return server.submitTransaction(tx)
    }


    return {
        generateMessage, getChallenge, signature, createAccountTransaction, publishVoteTransaction, createEncodedMemo, publishAccountTransaction,
    }
}

async function TDS(t: ExecutionContext) {
    const tdsBlindingSessionKeypair = ed25519.keyFromSecret(randomBytes(32))
    const encryptionKeypair = Keypair.random()
    // This value must be constant to every voter and available to every voter
    const signerSession = new SignerSession(tdsBlindingSessionKeypair.getSecret());
    const { issuerKeypair, distributionKeypair, ballotBoxKeypair, votingToken } = await createVoting()

    async function createVoting() {
        const issuerKeypair = Keypair.random()
        const votesCap = 10
        const tdsStartingBalance = votesCap * 2

        await createIssuerAccount(masterKeypair, issuerKeypair, tdsStartingBalance)

        const votingToken = createVoteToken(issuerKeypair.publicKey(), randomBytes(20).toString('hex'))
        console.log('created vote token', votingToken)
        const [distributionKeypair, ballotBoxKeypair] =
            await createDistributionAndBallotAccount(issuerKeypair, votesCap, votingToken, tdsStartingBalance)
        console.log('created tds, ballotbox and vote token')
        return { issuerKeypair, distributionKeypair, ballotBoxKeypair, votingToken }
    }

    const initBlindToken = (authenticationToken: string) => {
        // @ts-ignore
        const { userId, votingId } = jwt.verify(authenticationToken, AS_KEY, { audience: 'Stellot', issuer: 'Stellot' })

        t.true(USER_ID === userId)
        t.true(VOTING_ID === votingId)

        // TDS check if the voter did not issued token yet
        // TDS allow user to create blindedTransaction by generating him the blinding factor
        return {
            blindingNonce: ed25519.encodePoint(signerSession.publicNonce()),
            publicKey: ed25519.encodePoint(signerSession.publicKey()),
        }
    }
    const sign = (e: BN) => signerSession.sign(e)
    const publicNonce = () => signerSession.publicNonce()
    const publicKey = () => signerSession.publicKey()
    const signBlindly = (challenge: BN) => signerSession.sign(challenge)
    const tdsPublicKey = () => distributionKeypair.publicKey()
    const issuerPublicKey = () => issuerKeypair.publicKey()
    const encryptionKey = () => encryptionKeypair.publicKey()
    const decryptionKey = () => encryptionKeypair.secret()
    const ballotBoxPublicKey = () => ballotBoxKeypair.publicKey()

    const requestAccountCreation = (tx: Transaction, authorizationToken: { message: Buffer, signature: Buffer }) => {
        if (!ed25519.verify(authorizationToken.message, authorizationToken.signature, ed25519.encodePoint(signerSession.publicKey()))) {
            throw new Error('Verification failed')
        }
        const publicKeyPoint = authorizationToken.message.slice(0, ed25519.encodePoint(signerSession.publicKey()).length)
        t.deepEqual(publicKeyPoint, Buffer.from(ed25519.encodePoint(signerSession.publicKey())))
        const votingId = authorizationToken.message.slice(ed25519.encodePoint(signerSession.publicKey()).length).toString()
        console.log('extraction votingId', votingId)
        t.deepEqual(votingId, VOTING_ID)
        // check if userId is already contained in the issuedUsers db

        tx.sign(distributionKeypair)
        // Validate transactions
        // Submit transaction in case voter doesn't do so
        server.submitTransaction(tx)
        // Return the signed transaction to the user
        return tx
    }


    return {
        initBlindToken, sign, publicNonce, publicKey, signBlindly, tdsPublicKey,
        issuerPublicKey, requestAccountCreation, encryptionKey, decryptionKey, ballotBoxPublicKey, votingToken,
    }
}

test('complete voting protocol', async (t: ExecutionContext) => {
    try {
        const tds = await TDS(t)
        const as = AS()
        // Voter authenticate in AS with his ID
        // ...
        // AS issue JWT authenticationToken
        const authenticationToken = as.obtainAuthenticationToken()
        console.log(authenticationToken)

        // Voter present the authenticationToken to TDS
        // TDS verify the token
        const { publicKey, blindingNonce } = tds.initBlindToken(authenticationToken)


        // Voter prepare the blinding token using the blinding factor
        const voter = Voter(t, publicKey, blindingNonce);
        const message = voter.generateMessage()
        const challenge = voter.getChallenge(message)
        const blindedSignature = tds.signBlindly(challenge);
        const signature = voter.signature(blindedSignature);

        const authorizationToken = { signature, message }

        // Voter waits some random time peroid 1-10s
        // and shows up as anonymous voter with blindly singed token
        // and request account creation transaction

        const accountCreationTx = await voter.createAccountTransaction(tds.tdsPublicKey(), tds.votingToken, 100)
        const sigedAccountCreationTx = tds.requestAccountCreation(accountCreationTx, authorizationToken)
        const createAccRes = await voter.publishAccountTransaction(sigedAccountCreationTx)
        console.log(createAccRes.hash)

        const encodedMemo = voter.createEncodedMemo(1)
        const castVoteRes = await voter.publishVoteTransaction(encodedMemo, tds.votingToken, tds.tdsPublicKey(), tds.ballotBoxPublicKey(), tds.encryptionKey())
        console.log(castVoteRes.hash)
    } catch (e) {
        console.log({
            extras: e.response.data.extras,
            operations: e.response.data.extras.result_codes.operations
        })
        t.fail()
    }
})

function sleep(time: number) {
    return new Promise((resolve, rejest) => {
        setTimeout(resolve, time)
    })
}

test.only('handle multiple voters', async (t: ExecutionContext) => {
    try {
        const tds = await TDS(t)
        const as = AS()
        await Promise.all([1, 2, 3].map(async (index) => {
            console.log(`starting ${index} voter`)
            // Voter authenticate in AS with his ID
            // ...
            // AS issue JWT authenticationToken
            const authenticationToken = as.obtainAuthenticationToken()
            console.log(authenticationToken)

            // Voter present the authenticationToken to TDS
            // TDS verify the token
            const { publicKey, blindingNonce } = tds.initBlindToken(authenticationToken)


            // Voter prepare the blinding token using the blinding factor
            const voter = Voter(t, publicKey, blindingNonce);
            const message = voter.generateMessage()
            const challenge = voter.getChallenge(message)
            const blindedSignature = tds.signBlindly(challenge);
            const signature = voter.signature(blindedSignature);

            const authorizationToken = { signature, message }

            // Voter waits some random time peroid 1-10s
            // and shows up as anonymous voter with blindly singed token
            // and request account creation transaction

            console.log('falling asleep', index)
            await sleep(index * 5000)
            console.log('wakingup', index)
            const accountCreationTx = await voter.createAccountTransaction(tds.tdsPublicKey(), tds.votingToken, 100)
            const sigedAccountCreationTx = tds.requestAccountCreation(accountCreationTx, authorizationToken)
            const createAccRes = await voter.publishAccountTransaction(sigedAccountCreationTx)
            console.log(createAccRes.hash)

            const encodedMemo = voter.createEncodedMemo(1)
            const castVoteRes = await voter.publishVoteTransaction(encodedMemo, tds.votingToken, tds.tdsPublicKey(), tds.ballotBoxPublicKey(), tds.encryptionKey())
            console.log(castVoteRes.hash)
        }))
    } catch (e) {
        console.log({
            extras: e.response.data.extras,
            operations: e.response.data.extras.result_codes.operations
        })
        t.fail()
    }
})