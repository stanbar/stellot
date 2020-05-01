export async function requestToken(email: string): Promise<any> {
  const response = await fetch(`${REACT_APP_ENV === 'production' ? EMAILS_AUTH_SERVER_URL : ''}/auth/emails/requestToken`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  if (response.ok) {
    console.log('Successfully requested token');
  } else {
    console.error('Failed to request token');
    const errorBody = await response.json();
    throw new Error(errorBody?.errors?.message);
  }
}
