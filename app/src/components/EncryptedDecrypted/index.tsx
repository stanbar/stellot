import React, { useState } from 'react';
import { Tooltip as AntTooltip } from 'antd';
import { getMyCandidate } from '@/services/stellar';
import styles from './index.less';
import { Voting } from '@stellot/types';
import { StoredVoting } from '@/storage';

interface EncryptedDecryptedProps {
  voting: Voting;
  storedVoting: StoredVoting;
}

const EncryptedDecrypted: React.FC<EncryptedDecryptedProps> = ({ voting, storedVoting }) => {
  const [decrypted, setDecrypted] = useState<string | undefined>(undefined);
  const [encrypted, setEncrypted] = useState<string | undefined>(
    storedVoting.myTxMemo?.toString('hex'),
  );

  function getRandomInt(min: number, max: number) {
    // stackoverflow.com/a/24152886/5156280
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function returnLetter() {
    return String.fromCharCode(getRandomInt(97, 122));
  }

  const timeout = (ms: number) => new Promise((res) => setTimeout(res, ms));

  async function animateDecryption(targetMyOption: string, index: number) {
    if (index > targetMyOption.length) {
      return;
    }

    setEncrypted(
      encrypted!.substring(index * Math.ceil(encrypted!.toString().length / targetMyOption.length)),
    );
    for (let i = 0; i < 10; i += 1) {
      setDecrypted(targetMyOption.substring(0, index) + returnLetter());
      await timeout(30);
    }
    setDecrypted(targetMyOption.substring(0, index + 1));
    animateDecryption(targetMyOption, index + 1);
  }

  return (
    <>
      {decrypted}
      <AntTooltip title="Ballot is encrypted, click to decrypt">
        <span
          onClick={async () => {
            if (
              !!storedVoting.myTxMemo &&
              !!storedVoting.seqNumber &&
              !!storedVoting.voterPublicKey
            ) {
              const targetMyOption = await getMyCandidate(
                voting,
                storedVoting.myTxMemo,
                storedVoting.seqNumber,
                storedVoting.voterPublicKey,
              );
              if (targetMyOption) {
                setEncrypted(storedVoting.myTxMemo.toString('hex'));
                animateDecryption(targetMyOption.name, 0);
                return;
              }
            }
            setDecrypted('Could not decode voting option');
          }}
          className={styles.cipher}
          style={{ marginLeft: 4 }}
        >
          {encrypted}
        </span>
      </AntTooltip>
    </>
  );
};
export default EncryptedDecrypted;
