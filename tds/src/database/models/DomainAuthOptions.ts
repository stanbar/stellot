import mongoose, { model } from 'mongoose';
import { DOMAIN_AUTH_OPTIONS, VOTING } from '.';

const DomainAuthOptionsSchema = new mongoose.Schema({
  voting: { type: mongoose.Schema.Types.ObjectId, ref: VOTING, unique: true, required: true },
  domain: {
    type: String, required: true,
    // TODO add strict validation
  },
});

export default model(DOMAIN_AUTH_OPTIONS, DomainAuthOptionsSchema);
