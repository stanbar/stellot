import mongoose, { model } from 'mongoose';
import { KEYCHAIN, VOTING } from '.';

const KeychainSchema = new mongoose.Schema({
  voting: { type: mongoose.Schema.Types.ObjectId, ref: VOTING, unique: true, required: true },
  distribution: { type: String, required: true },
  issuer: { type: String, required: true },
  ballotBox: { type: String, required: true },
});

export default model(KEYCHAIN, KeychainSchema);
