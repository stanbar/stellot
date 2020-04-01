import mongoose, { model } from 'mongoose';
import { EMAIL_AUTH_OPTIONS, VOTING } from '.';

const EmailAuthOptionsSchema = new mongoose.Schema({
  voting: { type: mongoose.Schema.Types.ObjectId, ref: VOTING, unique: true, required: true },
  domain: { type: String, required: false },
});

export default model(EMAIL_AUTH_OPTIONS, EmailAuthOptionsSchema);
