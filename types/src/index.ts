import CreateVotingRequest from './createVotingRequest'
import CreateVotingResponse from './createVotingResponse'
import EmailAuthOptions from './emailAuth'
import KeybaseAuthOptions from './keybaseAuth'
import Option from './option'
import Poll from './poll'
import Voting from './voting'

enum Authorization {
    OPEN = 'open',
    EMAIL = 'email',
    CODE = 'code',
    KEYBASE = 'keybase',
}
enum Visibility {
    PUBLIC = 'public',
    UNLISTED = 'unlisted',
    PRIVATE = 'private'
}

export {
    CreateVotingRequest, CreateVotingResponse, EmailAuthOptions, KeybaseAuthOptions,
    Option, Poll, Voting, Authorization, Visibility,
}
