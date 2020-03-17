import mongoose, { model } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';
import slug from 'slug';
import { Authorization, Visibility } from '../../types/voting';
import { VOTING } from '.';

const VotingSchema = new mongoose.Schema({
  slug: { type: String, lowercase: true, unique: true },
  title: String,
  description: String,
  options: [{ name: String, code: Number }],
  votesVap: Number,
  encrypted: Boolean,
  startDate: { type: Date, default: Date.now },
  endDate: Date,
  authorization: {
    type: String,
    enum: [Authorization.PUBLIC, Authorization.EMAIL, Authorization.CODE, Authorization.CUSTOM],
  },
  visibility: {
    type: String,
    enum: [Visibility.PUBLIC, Visibility.UNLISTED, Visibility.UNLISTED],
  },
  assetCode: String,
  issueAccountId: String,
  distributionAccountId: String,
  ballotBoxAccountId: String,
}, { timestamps: true });

VotingSchema.plugin(uniqueValidator, { message: 'is already taken' });

VotingSchema.set('toJSON', {
  virtuals: true,
});

VotingSchema.set('toObject', {
  virtuals: true,
});

VotingSchema.pre('validate', function (next) {
  // @ts-ignore
  if (!this.slug) {
    // @ts-ignore
    this.slugify();
  }

  next();
});

VotingSchema.methods.slugify = function () {
  // eslint-disable-next-line no-bitwise
  this.slug = `${slug(this.title)}-${(Math.random() * (36 ** 6) | 0).toString(36)}`;
};

export default model(VOTING, VotingSchema);
