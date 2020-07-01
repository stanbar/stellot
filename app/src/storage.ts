export interface StoredVoting {
  authenticationToken?: string,
  myTxHash?: string,
  myTxMemo?: Buffer,
  voted?: boolean,
  seqNumber?: string,
  voterPublicKey?: string,
}

function getVoting(votingId: string): StoredVoting | undefined {
  const jsonString = localStorage.getItem(votingId)
  if (!jsonString) {
    return undefined;
  }
  const parsed = JSON.parse(jsonString);
  if(!parsed.myTxMemo){
    return parsed
  }
  parsed.myTxMemo = Buffer.from(parsed.myTxMemo)
  return parsed
}

function setVoting(votingId: string, storedVoting: StoredVoting) {
  localStorage.setItem(votingId, JSON.stringify(storedVoting))
}

export function setAuthenticationToken(votingId: string, authenticationToken?: string) {
  const voting = getVoting(votingId) || {};
  voting.authenticationToken = authenticationToken;
  setVoting(votingId, voting);
}

export function getAuthenticationToken(votingId: string): string | undefined {
  return getVoting(votingId)?.authenticationToken
}

export function setMyTransaction(votingId: string, txHash: string, memo: Buffer, seqNumber: string, voterPublicKey: string) {
  const voting = getVoting(votingId) || {};
  voting.myTxHash = txHash;
  voting.myTxMemo = memo;
  voting.seqNumber = seqNumber;
  voting.voterPublicKey = voterPublicKey;
  setVoting(votingId, voting)
}

export function getMyTransaction(votingId: string): StoredVoting {
  return { ...getVoting(votingId) }
}

export function didAlreadyVotedIn(votingId: string): boolean {
  return getVoting(votingId)?.voted ?? false
}

export function setAlreadyVotedIn(votingId: string) {
  const voting = getVoting(votingId) || {};
  voting.voted = true;
  setVoting(votingId, voting)
}