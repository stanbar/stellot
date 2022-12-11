import React from 'react';
import { ConnectProps } from '@/models/connect';
import { connect } from 'dva';
import { Voting } from '@stellot/types';
import { VoteStatus } from '@/types/voteStatus';
import { Collapse } from 'antd';
import { CaretRightOutlined } from '@ant-design/icons/lib';
import styles from './index.less';
import stellotDecentralization from '../../assets/svg/stellot-decentralization.svg';
import sequenceDiagram from '../../assets/svg/sequence-diagram.svg';
import { H3, P } from '../index';

const { Panel } = Collapse;

interface VotePreviewProps extends ConnectProps {
  voting?: Voting;
  status?: VoteStatus;
  loading?: boolean;
  txHash?: string;
}

const FAQ: React.FC<VotePreviewProps> = () => (
  <div>
    <H3>FAQ</H3>
    <Collapse
      bordered={false}
      expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
      className={styles.whitePanel}
    >
      <Panel header={<h2>How to visualise the voting protocol used in Stellot?</h2>} key="sequence-flow">
        <article>
          <P>
            To understand the Stellar voting protocol, we present the real life analogy consisting of the following steps:
            There are four actors in the voting protocol: 
            <ul>
              <li>User, a voter,</li>
              <li>Identity Provider (IdP), an entity validating User's identity, and issuing a certificate,</li>
              <li>Token Distribution Server (TDS), an entity validating (previously issued by IdP) User's certificate and issuing a vote token, and then redeeming the token for a ballot paper,</li>
              <li>Ballot Box, an entity collecting votes.</li>
            </ul>


            The following sequence diagram shows the voting protocol in Stellot:
            <img
              width="80%"
              style={{ textAlign: 'center' }}
              src={sequenceDiagram}
              alt="sequence diagram"
            />

            <ol>
              <li>User proof its identity to Identity Provider.</li>
              <li>Identity Provider issue certificate.</li>
              <li>
                User writes an authorization token (random number) on a paper and put it into an
                envelope with a carbon paper.
              </li>
              <li>User goes to an pooling station, shows the certificate and the authorization token.</li>
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

          </P>
        </article>
      </Panel>
      <Panel
        header={
          <h2>
            How can a user verify that his vote has been counted correctly?
          </h2>
        }
        key="verify-vote"
      >
        <article>
          <P>
            A voting act is represented as a stellar transaction. This transaction transfers one vote
            token from distribution account to ballot-box account. A user itself is responsible for
            creating and publishing such transaction <strong>directly</strong> to the Stellar
            blockchain. Upon successfully publishing the transaction, the user obtains the transaction id,
            which can be used to track the transaction in the blockchain. If a user loses the transaction id,
            he can not prove his vote option. We considered it rather as a privacy feature than a flaw.
          </P>
        </article>
      </Panel>
      <Panel
        header={
          <h2>
            Who validate transactions? Is there any organization behind Stellar that
            can manipulate votes ?
          </h2>
        }
        key="who-makes-the-validation"
      >
        <article>
          <P>
            Stellar network uses Federated Byzantine Agreement, which is decentralized version of
            Byzantine Agreement. FBA allows anyone to join the network and participate in validation
            process. In Stellar, the validator nodes are held by many organizations, we could (and
            will) create our own Stellar nodes too. Additionally since the ballots are
            salt-encrypted, there is no way of filtering one kind of votes based on the vote option
            in it.
          </P>
        </article>
      </Panel>
      
      <Panel
        header={<h2>Is the system decentralized ?</h2>}
        key="1"
        className="site-collapse-custom-panel"
      >
        <article>
          <P>
            Before Stellot implements smart contracts (which should happen soon, see <a href="https://soroban.stellar.org">Stellot's Soroban</a>), only the crucial part of the system is decentralized — the ballot box storage and the client webapp. 
            As long as this system relies on a centralized identification provider, it inherits this property too. Figure below
            describe the parts of the system that are considered centralized and decentralized.
          </P>
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
          <P>
            In Stellot, besides auth, everything is recorded on the blockchain. 
            Each user can count the voting result independently, without trust in a central authority. 
            User is responsible for publishing the vote transaction to the blockchain, so he can be sure that his vote was taken into account. 
            But the biggest advantage is the fact that the votes are completely anonymous since no one (besides the voter) knows who cast the particular transaction to the network. 
            But everyone can be sure that this transaction was authorized by TDS (because he blindly signed the transaction).
          </P>
        </article>
      </Panel>
    </Collapse>
  </div>
);
export default connect()(FAQ);
