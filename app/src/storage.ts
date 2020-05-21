interface StoredVoting {
  authorizationToken?: string,
  myTxHash?: string,
  myTxMemo?: Buffer,
  voted?: boolean;
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

export function setAuthorizationToken(votingId: string, authorizationToken?: string) {
  const voting = getVoting(votingId) || {};
  voting.authorizationToken = authorizationToken;
  setVoting(votingId, voting);
}

export function getAuthorizationToken(votingId: string): string | undefined {
  return getVoting(votingId)?.authorizationToken
}

export function setMyTransaction(votingId: string, txHash: string, memo: Buffer) {
  const voting = getVoting(votingId) || {};
  voting.myTxHash = txHash;
  voting.myTxMemo = memo;
  setVoting(votingId, voting)
}

export function getMyTransaction(votingId: string): { myTxHash?: string, myTxMemo?: Buffer } {
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