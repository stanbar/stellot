import React from 'react';
import { ConnectProps } from "@/models/connect";
import { connect } from 'dva';
import Voting from "@/types/voting";
import { VoteStatus } from '@/types/voteStatus';
import { Collapse } from "antd";
import { CaretRightOutlined } from "@ant-design/icons/lib";
import './index.css'
import stellotDecentralization from '../../assets/svg/stellot-decentralization.svg';

const { Panel } = Collapse;

interface VotePreviewProps extends ConnectProps {
  voting?: Voting;
  status?: VoteStatus;
  loading?: boolean;
  txHash?: string;
}

const FAQ: React.FC<VotePreviewProps> = () => (
  <div>
    <Collapse
      bordered={false}
      expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0}/>}
      className="site-collapse-custom-collapse"
    >
      <Panel header={<h2>Is the system decentralized ?</h2>} key="1" className="site-collapse-custom-panel">
        <article>
          <p>{`Let's start with the big picture of the system`}</p>
          <img src={stellotDecentralization} alt="decentralized and centralized parts"/>
          <p style={{ whiteSpace: 'pre-line' }}>
            {`
          Let's take a Stellar Community Funding voting as an example.
          Galactictalk or Keybase would become Authentication Server(AS) so you can "Login with GalacticTalk/Keybase" account. CENTRALIZED
          The Stellar organization would run the Token Distribution Server (TDS), which will be responsible for both:
          signing transactions,
          and authorization (keeping track of who has already voted, and who is eligible for issuing ballot). CENTRALIZED.
          Client Webapp is just a user interface that is responsible to interact with AS, TDS, and Stellar Horizon API. DECENTRALIZED
          Stellar Horizon API is considered DECENTRALIZED since it is just API to stellar network, it can be hosted by anyone.
          Stellar Network is DECENTRALIZED.
          `}</p>
          <p>{`
          So yes, the government layer is centralized. I addressed this issue in section8 Fully Decentralized Blockchain Application.
          But it's important to realize how limited the power of government is in this system. Since he (the government) manages the authorization, he can block a certain users from casting vote.
          But he can not perform votes on other user behalf since there is only the limited publicly known number of created tokens (e.g. the number of galactictalk active users).
          Yes, he can assume that only 20% of users will take part in the election, and use the 80% of unspent tokens to perform vote on his behalf.
          But it still could be mitigated by limiting the number of tokens to the number of users who are incentivized to cast a vote, so the frequency would be high, therefore limiting the number of unspent tokens.

          Decentralized auth is a completely different topic, but It is something I would love to continue my research on. Zero-knowledge proofs might be the clue.
          `}
          </p>
        </article>
      </Panel>
      <Panel header={<h2>How is this app different from centralized apps?</h2>} key="2"
             className="site-collapse-custom-panel">
        <article>
          <p>{`
        Besides auth, everything is recorded on the blockchain. Each user can count the voting results on its behalf, without the trust to government.
        The user is responsible for publishing the vote transaction to the stellar voting, so he can be sure that his vote was taken into account.
        But the biggest advantage is the fact that the votes are completely anonymous since no one (besides the voter) knows who cast the particular transaction to the network.
        But everyone can be sure that this transaction was authorized by TDS (because he blindly signed the transaction).
        `}</p>
        </article>
      </Panel>
      <Panel header={<h2>how can a user verify that his vote is correct counted and stored in the blockchain ?</h2>}
             key="3"
             className="site-collapse-custom-panel">
        <article>
          <p>{`
        Casting vote is basically creating payment transaction of particular token from TDS account to ballot-box account.
        User know that transaction. He is responsible of publishing it to the Blockchain.
        You can see this transaction after you cast the ballot (publish it to the Blockchain).
        The app, shows you the link to this transaction. If user lose the transaction's id, he can not prove his vote option.
        We considered it rather as a privacy feature than flaw.`}</p>
        </article>
      </Panel>
      <Panel header={<h2>Does people can vote using proof of stake like on Binance with BNB?</h2>} key="4"
             className="site-collapse-custom-panel">
        <article>
          <p>{`
        This solution is built with non-crypto users in mind. I argue that this is the only way to use this solution on large scale.

        Proof-of-stake voting or I would rather say stake-weighted voting, would be very interesting in crypto space.
        If we take the basic weighting model, i.e. based just on amount of XLM on your account, then the implementation is really straightforward. Instead of the vote token go directly from distribution account to ballotBox account, it would go first from distributing account to the user account, and then from the user account to ballotBox account. This way, counting results would involve one additional step, checking the account balance at the end of elections.
        `}</p>
        </article>
      </Panel>
    </Collapse>
  </div>
);
export default connect()(FAQ);
