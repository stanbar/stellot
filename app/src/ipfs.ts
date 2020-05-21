//@ts-ignore
import IPFS from 'ipfs'
import { Voting } from '@stellot/types';

const nodePromise = IPFS.create({ repo: String(Math.random() + Date.now()) })

nodePromise.then(async (ipfs: any) => {
    const res = await ipfs.bootstrap.add(REACT_APP_ENV == 'development' ? '/ip4/127.0.0.1/tcp/4001/p2p/QmbtFamEGrMsfr7hKHWZyaVk9atxn9yhAnkMk3K6Cd3Dmk' 
    : '/ip4/80.238.125.248/tcp/4001/p2p/QmdkTEjyKgdsx6kLLdVcd3hEcCFzYsBsy1QmxiXNoe95iE')
    console.log('bootstrap', res)
}).catch(console.error)

async function putBallot(memo: string | Buffer): Promise<string> {
    const node = await nodePromise;
    const results = await node.add(memo)
    console.log({ results })
    console.log({ result: results[0] })
    return results[0].hash
}

async function getBallot(cid: string): Promise<Buffer> {
    const node = await nodePromise;
    return node.cat(cid)
}

export async function getVoting(cid: string): Promise<Voting> {
    const node = await nodePromise;
    return (await node.dag.get(cid)).value
}