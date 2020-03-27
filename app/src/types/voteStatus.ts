export enum VoteStatus {
  UNDEFINED = 'undefined',
  ERROR = 'Error',
  INITIALIZING = 'Initializing interactive blind signature protocol',
  CREATING_BLINDED_TRANSACTIONS = 'Creating blinded transactions',
  REQUESTED_CHALLENGE = 'Requested challenge',
  PROVING_CHALLENGE = 'Proving challenge',
  CALCULATING_SIGNATURE = 'Calculating signature',
  CASTING_VOTE = 'Casting vote',
  DONE = 'Done!',
}
