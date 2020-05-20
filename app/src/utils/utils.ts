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
    memo = Buffer.from(memo, 'hex');
  }
  const answers = new Array<number>(answerCount);
  for (let i = 0; i < answerCount; i += 1) {
    answers[i] = memo.readUInt8(i)
  }
  return answers;
}


function fallbackCopyTextToClipboard(text: string) {
  const textArea = document.createElement("textarea");
  textArea.value = text;

  // Avoid scrolling to bottom
  textArea.style.top = "0";
  textArea.style.left = "0";
  textArea.style.position = "fixed";

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    document.execCommand('copy');
  } catch (err) {
    console.error(err)
  }

  document.body.removeChild(textArea);
}

export function copyTextToClipboard(text: string) {
  if (!navigator.clipboard) {
    fallbackCopyTextToClipboard(text);
    return;
  }
  navigator.clipboard.writeText(text).then(() => {
    console.log('Async: Copying to clipboard was successful!');
  }, (err) => {
    console.error('Async: Could not copy text: ', err);
  });
}

export const isEmail = (arg: string) => arg.match(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)
