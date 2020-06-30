export const VOTING = 'Voting';
export const KEYCHAIN = 'Keychain';
export const KEYBASE_AUTH_OPTIONS = 'KeybaseAuthOptions';
export const EMAILS_AUTH_OPTIONS = 'EmailsAuthOptions';
export const DOMAIN_AUTH_OPTIONS = 'DomainAuthOptions';
export const CHANNEL = 'Channel';

// Don't change order because of cyclic dependency
import Voting from './Voting'
import Keychain from './Keychain'
import KeybaseAuthOptions from './KeybaseAuthOptions'
import EmailsAuthOptions from './EmailsAuthOptions'
import DomainAuthOptions from './DomainAuthOptions'
import Channel from './Channel'

export {
  Voting, Keychain, KeybaseAuthOptions, EmailsAuthOptions, DomainAuthOptions, Channel,
}
