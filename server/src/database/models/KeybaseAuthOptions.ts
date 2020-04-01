import mongoose, { model } from 'mongoose';
import { KEYBASE_AUTH_OPTIONS, VOTING } from '.';

const KeybaseAuthSchema = new mongoose.Schema({
  voting: { type: mongoose.Schema.Types.ObjectId, ref: VOTING, unique: true, required: true },
  team: { type: String, required: false },
});

export default model(KEYBASE_AUTH_OPTIONS, KeybaseAuthSchema);
