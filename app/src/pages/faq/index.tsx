import React from 'react';
import { ConnectProps } from '@/models/connect';
import { connect } from 'dva';
import { Voting } from '@stellot/types';
import { VoteStatus } from '@/types/voteStatus';
import { Collapse } from 'antd';
import { CaretRightOutlined } from '@ant-design/icons/lib';
import { Title } from '@/components/Title';
import styles from './index.less';
import stellotDecentralization from '../../assets/svg/stellot-decentralization.svg';
import sequenceDiagram from '../../assets/svg/sequence-diagram.svg';

const { Panel } = Collapse;

interface VotePreviewProps extends ConnectProps {
  voting?: Voting;
  status?: VoteStatus;
  loading?: boolean;
  txHash?: string;
}

const FAQ: React.FC<VotePreviewProps> = () => (
  <div>
    <Title style={{ textAlign: 'center' }}>FAQ</Title>
    <Collapse
      bordered={false}
      expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
      className={styles.whitePanel}
    >
      <Panel
        header={<h2>How does the whole process of voting look like?</h2>}
        key="sequence-flow"
      >
        <article>
          <p>
            <img
              width="80%"
              style={{ textAlign: 'center' }}
              src={sequenceDiagram}
              alt="sequence diagram"
            />
            <ol>
              <li>User proof its identity to Identity Provider.</li>
              <li>Identity Provider issue certificate. </li>
              <li>
                User writes an authorization token (random number) on paper and put it into the
                envelope with carbon paper.
              </li>
              <li>User goes to election local, pass the certificate and authorization token.</li>
              <li>
                TDS validate the certificate and check if the user hasn't already issued ballot
                paper, then sign the envelope, and authorization token through the carbon.
              </li>
              <li>User put off the authorization token from the envelope.</li>
              <li>User wait a random amount of time outside the election local.</li>
              <li>
                User put the mask on his face, goes back the election local this time as Anonymous,
                and redeem the authorization token for ballot-paper.
              </li>
              <li>Anonymous mark the candidate.</li>
              <li>Anonymous throws the ballot paper into the ballot box.</li>
            </ol>
          </p>
        </article>
      </Panel>
      <Panel
        header={
          <h2>
            How can a user verify that his vote is correct counted and stored in the blockchain ?
          </h2>
        }
        key="verify-vote"
      >
        <article>
          <p>
            A voting act is represented in the stellar transaction. This transaction transfer 1 vote
            token from distribution account to ballot-box account. A user itself is responsible for
            creating and publishing such transaction <strong>directly</strong> to the Stellar
            blockchain network. After a user successfully publishes the transaction, he obtains the
            transaction id, which can be used to track the transaction in the blockchain. If a user
            loses the transaction id, he can not prove his vote option. We considered it rather as a
            privacy feature than a flaw.
          </p>
        </article>
      </Panel>
      <Panel
        header={
          <h2>
            Who makes the validation of transactions? Is there any organization behind Stellar that
            can manipulate votes ?
          </h2>
        }
        key="who-makes-the-validation"
      >
        <article>
          <p>
            Stellar network uses Federated Byzantine Agreement, which is decentralized version of
            Byzantine Agreement. FBA allows anyone to join the network and participate in validation
            process. In Stellar, the validator nodes are held by many organizations, we could (and
            will) create our own Stellar nodes too. Additionally since the ballots are
            salt-encrypted, there is no way of filtering one kind of votes based on the vote option
            in it.
          </p>
        </article>
      </Panel>
      <Panel
        header={<h2>Can people vote using proof of stake like on Binance with BNB?</h2>}
        key="proof-of-stake"
        className="site-collapse-custom-panel"
      >
        <article>
          <p>
            This solution is built with non-crypto users in mind. We argue that this is the only way
            to use this solution on large scale. Proof-of-stake voting or rather stake-weighted
            voting, would be very interesting in crypto space. If we take the basic weighting model,
            i.e. based just on amount of XLM on your account, then the implementation is really
            straightforward. Instead of the vote token go directly from distribution account to
            ballot-box account, it would go first from distribution account to the user account, and
            then from the user account to ballot-box account. This way, counting results would
            involve one additional step, checking the account balance at the end of elections. This
            kind of voting has one disadvantage, we lose privacy.
          </p>
        </article>
      </Panel>
      <Panel
        header={<h2>Is the system decentralized ?</h2>}
        key="1"
        className="site-collapse-custom-panel"
      >
        <article>
          <p>
            Right now only the crucial part of the system is decentralized, that is the storage
            (a.k.a. Ballot-Box) and the client webapp. As long as this system relies on a
            centralized identification provider, it inherits this property too. Figure below
            describe the parts of the system that are considered centralized and decentralized.
          </p>
          <img
            width="80%"
            style={{ textAlign: 'center' }}
            src={stellotDecentralization}
            alt="decentralized and centralized parts"
          />
        </article>
      </Panel>
      <Panel
        header={<h2>How is this app different from centralized apps?</h2>}
        key="2"
        className="site-collapse-custom-panel"
      >
        <article>
          <p>
            In Stellot, besides auth, everything is recorded on the blockchain. Each user can count
            the voting results on its behalf, without the trust to government. The user is
            responsible for publishing the vote transaction to the stellar voting, so he can be sure
            that his vote was taken into account. But the biggest advantage is the fact that the
            votes are completely anonymous since no one (besides the voter) knows who cast the
            particular transaction to the network. But everyone can be sure that this transaction
            was authorized by TDS (because he blindly signed the transaction).
          </p>
        </article>
      </Panel>
    </Collapse>
  </div>
);
export default connect()(FAQ);
