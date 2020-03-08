

function validateVoteTokenTransferOp(transaction) {
  const expectedIssueToken = transaction.operations[0]
  if (expectedIssueToken.type !== 'payment') {
    throw new Error(
      `operation[0] type is ${expectedIssueToken.type} but should be payment`,
    )
  }
  if (expectedIssueToken.asset.issuer !== voteToken.issuer) {
    throw new Error(
      `operation[0] issuer is ${expectedIssueToken.asset.issuer} but should be ${voteToken.issuer}`,
    )
  }
  if (expectedIssueToken.asset.code !== voteToken.code) {
    throw new Error(
      `operation[0] code is ${expectedIssueToken.asset.code} but should be ${voteToken.code}`,
    )
  }
  if (expectedIssueToken.amount !== '0.0000001') {
    throw new Error(
      `operation[0] amount is ${expectedIssueToken.amount} but should be 0.0000001`,
    )
  }
}

export function validateTransaction(txn, userId) {
  const transaction = new StellarSdk.Transaction(
    txn,
    StellarSdk.Networks.TESTNET,
  )

  if (transaction.memo.type !== 'text') {
    throw new Error(
      `transaction.memo.type: ${transaction.memo.type} doesn't equal text`,
    )
  }
  if (String(transaction.memo.value) !== userId) {
    throw new Error(
      `transaction.memo: ${String(
        transaction.memo.value,
      )} doesn't equal userId: ${userId}`,
    )
  }
  if (transaction.operations.length !== 1) {
    throw new Error(
      `transaction.operations.length: ${transaction.operations.length} doesnt equal 1`,
    )
  }
  validateVoteTokenTransferOp(transaction)
}
