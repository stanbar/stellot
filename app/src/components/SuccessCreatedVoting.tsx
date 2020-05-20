import { connect } from 'dva';
import { ConnectProps } from "@/models/connect";
import React, { useState } from "react";
import { Modal, Input, Button } from 'antd';
import { history } from "umi";
import { Voting } from "@stellot/types";
import CopyToClipboard from 'react-copy-to-clipboard';
import { dispatchCancelSuccessCreationModel, CreateStateType } from '@/models/create';
import { BallotBoxIcon } from '@/assets/BallotBoxIcon';
import { AuditOutlined, CheckCircleTwoTone } from '@ant-design/icons';

interface SuccessCreatedVotingModalProps extends ConnectProps {
    voting?: Voting;
    showSuccessCreation?: boolean;
}

const SuccessCreatedVotingModal: React.FC<SuccessCreatedVotingModalProps> = props => {
    const { dispatch, voting, showSuccessCreation } = props;
    const [copied, setCopied] = useState(false)
    if (!voting || !showSuccessCreation) {
        return <></>
    }
    const showVoting = () => {
        history.replace(`/voting/${voting.slug}`);
        dispatchCancelSuccessCreationModel(dispatch)
    };
    console.log({ location: window.location })
    return (
        <Modal visible={voting && showSuccessCreation}
            title={<h2><CheckCircleTwoTone twoToneColor="#52c41a" style={{marginRight: 4}} />Successfully created voting</h2>}
            closable={true}
            width={500}
            okText="Show voting"
            onOk={showVoting}
            onCancel={() => dispatchCancelSuccessCreationModel(dispatch)}
            bodyStyle={{ textAlign: 'center' }}
        >
            <Input onClick={e => e.preventDefault()} value={`${window.location.origin}/voting/${voting.slug}`} addonAfter={<CopyToClipboard text={`${window.location.origin}/voting/${voting.slug}`}
                onCopy={() => setCopied(true)}>
                <a>{copied ? "Copied!" : "Copy"}</a>
            </CopyToClipboard>
            } />
            <a rel="noopener noreferrer" target="_blank"
                href={`https://testnet.lumenscan.io/account/${voting.distributionAccountId}`}>
                <Button type="link" icon={<AuditOutlined />}>
                    <span style={{ marginLeft: 2 }}>Distribution account</span>
                </Button>
            </a>
            <a rel="noopener noreferrer" target="_blank"
                href={`https://testnet.lumenscan.io/account/${voting.ballotBoxAccountId}`}>
                <Button type="link" icon={<BallotBoxIcon />}>
                    <span style={{ marginLeft: 2 }}>Ballot-box account</span>
                </Button>
            </a>
        </Modal>
    )

};

export default connect(({ create }: { create: CreateStateType }) =>
    ({
        voting: create.voting,
        showSuccessCreation: create.showSuccessCreation,
    }))(SuccessCreatedVotingModal);
