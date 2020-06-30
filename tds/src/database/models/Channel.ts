import { model, Document, Schema } from 'mongoose';
import { CHANNEL, VOTING } from '.';

const ChannelSchema = new Schema({
  voting: { type: Schema.Types.ObjectId, ref: VOTING, required: true },
  secret: { type: String, unique: true, required: true },
  used: { type: Boolean, required: true },
});

export interface IChannelSchema extends Document {
  voting: string;
  secret: string;
  used: boolean;
}

export default model<IChannelSchema>(CHANNEL, ChannelSchema);
