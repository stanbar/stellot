import { Keypair } from 'stellar-sdk';
import ChannelSchema, { IChannelSchema } from './models/Channel';

export interface Channel {
  _id: string;
  voting: string;
  secret: string;
  used: boolean;
}

export async function consumeChannel(votingId: string): Promise<Channel | null> {
  const channel: IChannelSchema | null = await ChannelSchema.findOne({
    voting: votingId,
    used: false,
  });
  if (!channel) {
    return null;
  }
  channel.used = true;
  await channel.save();
  // @ts-ignore
  return channel.toJSON();
}

export async function saveChannels(votingId: string, channels: Keypair[]): Promise<Channel[]> {
  // @ts-ignore
  return Promise.all(
    channels.map(async channel => {
      const channelSchema = new ChannelSchema({
        voting: votingId,
        secret: channel.secret(),
        used: false,
      });
      const saved = await channelSchema.save();
      return saved.toJSON();
    }),
  );
}
