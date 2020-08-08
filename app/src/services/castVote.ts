import BN from 'bn.js';

const BASE_URL = REACT_APP_ENV === 'production' ? TDS_SERVER_URL : '';

export interface ResSession {
  nonce: string; // hex
  publicKey: string; // hex
}

export async function initSession(
  votingId: string,
  authToken?: string,
): Promise<[string, ResSession]> {
  console.log({ initSession: authToken });
  const response = await fetch(`${BASE_URL}/api/castVote/init`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
    },
    body: JSON.stringify({ votingId }),
  });

  if (response.ok) {
    console.log('Successfully inited session');
  } else {
    console.error('Failed to init session');
    const body = await response.json();
    throw new Error(body?.errors?.message);
  }
  const sessionId = response.headers.get('SESSION-TOKEN') || response.headers.get('session-token');
  if (!sessionId) {
    console.error(`Didn't receive SESSION-TOKEN`);
    throw new Error(`Didn't receive SESSION-TOKEN`);
  }

  const responseJson: {
    nonce: Array<number>;
    publicKey: Array<number>;
  } = await response.json();

  return [
    sessionId,
    {
      nonce: Buffer.from(responseJson.nonce).toString('hex'),
      publicKey: Buffer.from(responseJson.publicKey).toString('hex'),
    },
  ];
}

export async function getSignedToken(sessionToken: string, challenge: BN): Promise<BN> {
  const response = await fetch(`${BASE_URL}/api/castVote/getSignedToken`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'SESSION-TOKEN': sessionToken,
    },
    body: JSON.stringify({ challenge }),
  });

  if (response.ok) {
    console.log('Successfully received challenges');
  } else {
    console.error('Failed to receive challenges');
    throw new Error(await response.text());
  }
  const { blindedSignature } = await response.json();
  console.log({ blindedSignature });
  return new BN(blindedSignature, 16);
}

export async function requestAccountCreation(
  voterPublicKey: string,
  votingId: string,
  { message, signature }: { message: Buffer; signature: Buffer },
): Promise<string> {
  const authorizationToken = {
    message: Buffer.from(message).toString('hex'),
    signature: Buffer.from(signature).toString('hex'),
  };
  console.log({
    message,
    signature,
    authorizationToken,
    messageBuffer: Buffer.from(message),
    signatureBuffer: Buffer.from(signature),
  });
  const response = await fetch(`${BASE_URL}/api/castVote/requestAccountCreation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      voterPublicKey,
      votingId,
      authorizationToken: {
        message: Buffer.from(message).toString('hex'),
        signature: Buffer.from(signature).toString('hex'),
      },
    }),
  });

  if (response.ok) {
    console.log('Successfully created account');
  } else {
    console.error('Failed to create account');
    throw new Error(await response.text());
  }
  const { transactionXdr } = await response.json();
  return transactionXdr;
}
