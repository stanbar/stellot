export const VOTING = 'Voting';
export const KEYCHAIN = 'Keychain';
export const KEYBASE_AUTH_OPTIONS = 'KeybaseAuthOptions';
export const EMAIL_AUTH_OPTIONS = 'EmailAuthOptions';

// Don't change order because of cyclic dependency
import Voting from './Voting'
import Keychain from './Keychain'
import KeybaseAuthOptions from './KeybaseAuthOptions'
import EmailAuthOptions from './EmailAuthOptions'

export {
  Voting, Keychain, KeybaseAuthOptions, EmailAuthOptions,
}
