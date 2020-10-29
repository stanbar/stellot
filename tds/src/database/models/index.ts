export const VOTING = 'Voting';
export const KEYCHAIN = 'Keychain';
export const KEYBASE_AUTH_OPTIONS = 'KeybaseAuthOptions';
export const EMAILS_AUTH_OPTIONS = 'EmailsAuthOptions';
export const DOMAIN_AUTH_OPTIONS = 'DomainAuthOptions';
export const CHANNEL = 'Channel';

// Don't change order because of cyclic dependency
import VotingModel from './Voting';
import KeychainModel from './Keychain';
import KeybaseAuthOptionsModel from './KeybaseAuthOptions';
import EmailsAuthOptionsModel from './EmailsAuthOptions';
import DomainAuthOptionsModel from './DomainAuthOptions';
import ChannelModel from './Channel';

export {
  VotingModel,
  KeychainModel,
  KeybaseAuthOptionsModel,
  EmailsAuthOptionsModel,
  DomainAuthOptionsModel,
  ChannelModel,
};
