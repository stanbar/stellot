import mongoose, { model } from 'mongoose';
import { KEYCHAIN, VOTING } from '.';

const KeychainSchema = new mongoose.Schema({
  voting: { type: mongoose.Schema.Types.ObjectId, ref: VOTING, unique: true, required: true },
  distribution: { type: String, required: true },
  issuer: { type: String, required: true },
  ballotBox: { type: String, required: true },
  decryption: { type: String, required: false },
});

export default model(KEYCHAIN, KeychainSchema);
