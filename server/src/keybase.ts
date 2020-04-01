import fetch from 'node-fetch';

export async function joinTeam(team: string) {
  await fetch(`${process.env.KEYBASE_AUTH_SERVER_URL}/auth/keybase/joinTeam`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ team }),
  });
  // we don't really care about the result
  // should we abort it it failed to join team ? no
  // should we abort if it is already in team ? no
}
