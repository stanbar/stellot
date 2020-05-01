import CreateVotingRequest from './createVotingRequest'
import CreateVotingResponse from './createVotingResponse'
import EmailsAuthOptions from './emailAuth'
import DomainAuthOptions from './domainAuth'
import KeybaseAuthOptions from './keybaseAuth'
import Option from './option'
import Poll from './poll'
import Voting from './voting'

enum Authorization {
    OPEN = 'open',
    EMAILS = 'emails',
    DOMAIN = 'domain',
    CODE = 'code',
    KEYBASE = 'keybase',
}

enum Visibility {
    PUBLIC = 'public',
    UNLISTED = 'unlisted',
    PRIVATE = 'private'
}

export {
    CreateVotingRequest, CreateVotingResponse, EmailsAuthOptions, DomainAuthOptions,
    KeybaseAuthOptions,
    Option, Poll, Voting, Authorization, Visibility,
}
