interface StoredVoting {
  authorizationToken?: string,
  myTxHash?: string,
  myTxMemo?: string | Buffer,
  voted?: boolean;
}

function getVoting(votingId: string): StoredVoting | undefined {
  const jsonString = localStorage.getItem(votingId)
  if (!jsonString) {
    return undefined;
  }
  return JSON.parse(jsonString);
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

export function setMyTransaction(votingId: string, txHash: string, memo: Buffer | string) {
  const voting = getVoting(votingId) || {};
  voting.myTxHash = txHash;
  voting.myTxMemo = memo;
  setVoting(votingId, voting)
}

export function getMyTransaction(votingId: string): { myTxHash?: string, myTxMemo?: string | Buffer } {
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