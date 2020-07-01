export enum VoteStatus {
  UNDEFINED = 'undefined',
  ERROR = 'Error',
  INITIALIZING = 'Initializing interactive blind signature protocol',
  CREATING_BLINDED_TOKEN = 'Creating blinded token',
  PREPARING_VOTING_ACCOUNT = 'Preparing voting account',
  PUBLISH_ACCOUNT_CREATION_TRANSACTION = 'Publishing account creation transaction',
  WAITING_RANDOM_PEROID = "Waiting random peroid of time",
  CASTING_VOTE = 'Casting vote',
  SAVING_CASTED_TRANSACTION = 'Saving casted vote',
  DONE = 'Done!',
}
