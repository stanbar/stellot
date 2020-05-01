import mongoose, { model } from 'mongoose';
import { EMAILS_AUTH_OPTIONS, VOTING } from '.';

const EmailsAuthOptionsSchema = new mongoose.Schema({
  voting: { type: mongoose.Schema.Types.ObjectId, ref: VOTING, unique: true, required: true },
  emails: {
    type: [{ type: String }], required: true,
    // TODO add strict validation
  },
});

export default model(EMAILS_AUTH_OPTIONS, EmailsAuthOptionsSchema);
