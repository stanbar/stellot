import CreateVotingRequest from './createVotingRequest'
import CreateVotingResponse from './createVotingResponse'
import EmailAuthOptions from './emailAuth'
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
    CreateVotingRequest, CreateVotingResponse, EmailAuthOptions, DomainAuthOptions,
    KeybaseAuthOptions,
    Option, Poll, Voting, Authorization, Visibility,
}
