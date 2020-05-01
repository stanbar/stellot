import Poll from './poll';
import KeybaseAuthOptions from './keybaseAuth';
import EmailsAuthOptions from "./emailAuth";
import { Visibility, Authorization } from './index';


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
    authorizationOptions: KeybaseAuthOptions | EmailsAuthOptions | undefined;
    visibility: Visibility;
    encrypted: boolean;
    votesCap: number;
    startDate: Date;
    endDate: Date;
}
