const database = {};

export function isAlreadyIssuedToUserId(userId: string) {
  database[userId] = true;
}
