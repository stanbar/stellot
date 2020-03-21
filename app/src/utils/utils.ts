export function isNotEmpty(str?: string) {
  return str && str.length !== 0 && str.trim();
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.substring(1);
}

export function decodeAnswersFromMemo(memo: Buffer | string, answerCount: number)
  : Array<number> {
  if (typeof memo === 'string') {
    // eslint-disable-next-line no-param-reassign
    memo = Buffer.from(memo, 'ascii');
  }
  const answers = new Array<number>(answerCount);
  for (let i = 0; i < answerCount; i += 1) {
    answers[i] = memo.readUInt8(i)
  }
  return answers;
}

