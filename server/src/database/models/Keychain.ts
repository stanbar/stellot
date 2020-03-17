import mongoose, { model } from 'mongoose';
import { KEYCHAIN, VOTING } from '.';

const KeychainSchema = new mongoose.Schema({
  voting: { type: mongoose.Schema.Types.ObjectId, ref: VOTING },
  distribution: String,
  issuer: String,
  ballotBox: String,
});

export default model(KEYCHAIN, KeychainSchema);
