export default interface Encryption {
    encryptedUntil: Date; // ISO 8601, Date.toJSON()
    encryptionKey: string;
    decryptionKey?: string;
}