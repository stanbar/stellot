export async function requestToken(username: string, requiredTeam?: string): Promise<any> {
  const response = await fetch('/auth/keybase/requestToken', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, requiredTeam }),
  });

  if (response.ok) {
    console.log('Successfully requested token');
  } else {
    console.error('Failed to request token');
    const errorBody = await response.json();
    throw new Error(errorBody?.errors?.message);
  }
}
