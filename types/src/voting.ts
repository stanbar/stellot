import Poll from './poll';
import KeybaseAuthOptions from './keybaseAuth';
import { Visibility, Authorization } from './index';
import Encryption from './encryption';


export default interface Voting {
    id: string;
    slug: string;
    title: string;
    issueAccountId: string;
    assetCode: string;
    polls: Poll[];
    distributionAccountId: string;
    ballotBoxAccountId: string;
    authorization: Authorization;
    authorizationOptions: KeybaseAuthOptions | undefined;
    visibility: Visibility;
    encryption: Encryption | undefined;
    votesCap: number;
    startDate: Date;
    endDate: Date;
    ipfsCid: string;
}
