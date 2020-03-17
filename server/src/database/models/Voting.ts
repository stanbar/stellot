import mongoose, { model } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';
import slug from 'slug';
import { Authorization, Visibility } from '../../types/voting';

const VotingSchema = new mongoose.Schema({
  slug: { type: String, lowercase: true, unique: true },
  title: String,
  description: String,
  assetCode: String,
  options: [{ name: String, code: Number }],
  authorization: {
    type: String,
    enum: [Authorization.PUBLIC, Authorization.EMAIL, Authorization.CODE, Authorization.CUSTOM],
  },
  visibility: {
    type: String,
    enum: [Visibility.PUBLIC, Visibility.UNLISTED, Visibility.UNLISTED],
  },
  issueAccountId: String,
  distributionAccountId: String,
  ballotBoxAccountId: String,
  votesVap: Number,
  encrypted: Boolean,
  startDate: { type: Date, default: Date.now },
  endDate: Date,
}, { timestamps: true });

VotingSchema.plugin(uniqueValidator, { message: 'is already taken' });

VotingSchema.pre('validate', function (next) {
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

export default model('Voting', VotingSchema);
