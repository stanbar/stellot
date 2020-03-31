import jwt from 'jsonwebtoken';

if (!process.env.JWT_SECRETKEY) {
  throw new Error('JWT_SECRETKEY must be set')
}
const audience = 'https://voting.stasbar.com';
const issuer = 'Stellot';

export function createJwt(username: string): string {
  const today = new Date();
  const exp = new Date(today);

  exp.setDate(today.getDate() + 60);
  return jwt.sign({}, process.env.JWT_SECRETKEY!, {
    expiresIn: '2 days',
    subject: username,
    audience,
    issuer,
  })
}

export function verifyAndDecodeJwt(token: string): string | undefined {
  const decodedToken = jwt.verify(token, process.env.JWT_SECRETKEY!, { audience, issuer });
  // @ts-ignore
  return decodedToken.sub;
}
