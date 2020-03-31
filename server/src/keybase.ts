export async function joinTeam(team: string) {
  await fetch('/auth/keybase/join/', {
    body: JSON.stringify({ team }),
  });
  // we don't really care about the result
  // should we abort it it failed to join team ? no
  // should we abort if it is already in team ? no
}
