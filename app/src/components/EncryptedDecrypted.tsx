import React, { useState } from "react";
import { Tooltip as AntTooltip } from "antd";
import { getMyCandidate } from "@/services/stellar";
import styles from "@/pages/voting/$id$/results/styles.less";
import { Voting } from "@stellot/types";

interface EncryptedDecryptedProps {
  voting: Voting;
  myTxMemo: string;
}

const EncryptedDecrypted: React.FC<EncryptedDecryptedProps> = (props: EncryptedDecryptedProps) => {
  const { voting, myTxMemo } = props;
  const [decrypted, setDecrypted] = useState<string | undefined>(undefined)
  const [encrypted, setEncrypted] = useState<string | undefined>(myTxMemo)

  function getRandomInt(min: number, max: number) {  // stackoverflow.com/a/24152886/5156280
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function returnLetter() {
    return String.fromCharCode(getRandomInt(97, 122))
  }

  const timeout = (ms: number) => new Promise(res => setTimeout(res, ms))

  async function animateDecryption(targetMyOption: string, index: number) {
    if (index > targetMyOption.length) {
      return
    }

    setEncrypted(encrypted!.substring(index * Math.ceil(encrypted!.toString().length / targetMyOption.length)))
    for (let i = 0; i < 10; i += 1) {
      setDecrypted(targetMyOption.substring(0, index) + returnLetter())
      await timeout(30)
    }
    setDecrypted(targetMyOption.substring(0, index + 1))
    animateDecryption(targetMyOption, index + 1)
  }

  return (
    <>
      {decrypted}
      <AntTooltip title="Ballot is encrypted, click to decrypt">
            <span onClick={() => {
              const targetMyOption = getMyCandidate(voting, myTxMemo)?.name
              if (!!targetMyOption && !!myTxMemo) {
                setEncrypted(myTxMemo?.toString())
                animateDecryption(targetMyOption, 0)
              } else {
                setDecrypted('Could not decode voting option')
              }
            }} className={styles.cipher} style={{ marginLeft: 4 }}>{encrypted}</span>
      </AntTooltip>
    </>
  )
}
export default EncryptedDecrypted;
