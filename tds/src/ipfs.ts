//@ts-nocheck
import IpfsClient from 'ipfs-http-client'
import { Voting } from '@stellot/types';


if (!process.env.IPFS_NODE_URL) {
    throw new Error('IPFS_NODE_URL must be set');
}

const ipfs = IpfsClient(process.env.IPFS_NODE_URL)
console.log(ipfs.getEndpointConfig())
ipfs.id().then(id => console.log({ id }))

// TODO send also the node id so the client can connect to it


export async function putVoting(voting: Omit<Voting, 'ipfsCid'>): Promise<string> {
    const normalizedObject = JSON.parse(JSON.stringify(voting))
    const cid = await ipfs.dag.put(normalizedObject, { pin: true, format: 'dag-cbor', hashAlg: 'sha2-256' })
    return cid.toString()
}