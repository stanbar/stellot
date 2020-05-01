import sgMail from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY must be specified')

}
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendEmail(to: string, token: string) {
  const msg = {
    to,
    from: 'Stellot Authenticator <noreply@stellot.com>',
    subject: 'Stellot voting authentication',
    text: `Welcome to Stellot, to continue, please copy and paste the token below back to the app:\n
    ${token}`,
    html: `Welcome to Stellot, to continue, please copy and paste the token below back to the app:\n
    <pre>${token}</pre>`,
  };
  try {
    await sgMail.send(msg);
  } catch (e) {
    console.error(e)
  }
}
