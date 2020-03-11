const database: { [key: string]: boolean } = {};

export function isAlreadyIssuedToUserId(userId: string) {
  database[userId] = true;
}
