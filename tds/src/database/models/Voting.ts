import mongoose, { model } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';
import slug from 'slug';
import { Authorization, Visibility } from '@stellot/types';
import {
  CHANNEL,
  DOMAIN_AUTH_OPTIONS,
  EMAILS_AUTH_OPTIONS,
  KEYBASE_AUTH_OPTIONS,
  KEYCHAIN,
  VOTING,
} from '.';

const VotingSchema = new mongoose.Schema(
  {
    slug: { type: String, lowercase: true, unique: true, required: true },
    title: { type: String, required: true },
    polls: [
      {
        question: { type: String, required: true },
        options: { type: [{ name: String, code: Number }], required: true },
      },
    ],
    votesCap: { type: Number, required: true },
    encryption: {
      type: { encryptionKey: String, encryptedUntil: String, decryptionKey: String },
      required: false,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    authorization: {
      type: String,
      enum: [
        Authorization.OPEN,
        Authorization.EMAILS,
        Authorization.DOMAIN,
        Authorization.CODE,
        Authorization.IP,
        Authorization.COOKIE,
        Authorization.KEYBASE,
      ],
      required: true,
    },
    visibility: {
      type: String,
      enum: [Visibility.PUBLIC, Visibility.UNLISTED, Visibility.UNLISTED],
      required: true,
    },
    assetCode: { type: String, required: true },
    issueAccountId: { type: String, required: true },
    distributionAccountId: { type: String, required: true },
    ballotBoxAccountId: { type: String, required: true },
    ipfsCid: { type: String, required: false },
  },
  { timestamps: true },
);

VotingSchema.plugin(uniqueValidator, { message: 'is already taken' });

VotingSchema.set('toJSON', {
  virtuals: true,
});

VotingSchema.set('toObject', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
  },
});

VotingSchema.pre('validate', function(next) {
  // @ts-ignore
  if (!this.slug) {
    // @ts-ignore
    this.slugify();
  }

  next();
});
function deleteReferences(votingId: String) {
  return Promise.all([
    model(CHANNEL).deleteMany({ voting: votingId }),
    model(DOMAIN_AUTH_OPTIONS).deleteMany({ voting: votingId }),
    model(EMAILS_AUTH_OPTIONS).deleteMany({ voting: votingId }),
    model(KEYBASE_AUTH_OPTIONS).deleteMany({ voting: votingId }),
    model(KEYCHAIN).deleteMany({ voting: votingId }),
  ]);
}

// @ts-ignore
VotingSchema.pre('deleteMany', { document: true, query: false },  async function() {
  // @ts-ignore
  await deleteReferences(this._id);
});

// It will trigger only on doc.deletOne() (document) not VotingSchema.deleteOne({...}) (query)
// because the latter one does not provide doc element with this so we skip it
// @ts-ignore
VotingSchema.pre('deleteOne', { document: true, query: false }, async function() {
  // @ts-ignore
  console.log('removing voting with _id with its corresponding references', this._id);
  // @ts-ignore
  await deleteReferences(this._id);
});

VotingSchema.methods.slugify = function() {
  // eslint-disable-next-line no-bitwise
  this.slug = `${slug(this.title)}-${((Math.random() * 36 ** 6) | 0).toString(36)}`;
};

export default model(VOTING, VotingSchema);
