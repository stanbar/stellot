import { Voting, Authorization } from "@stellot/types";

export function getKeybaseToken(): string | null {
  return localStorage.getItem('keybase');
}

export function setKeybaseToken(authorizationToken?: string) {
  if (authorizationToken) {
    localStorage.setItem('keybase', authorizationToken);
  } else {
    localStorage.removeItem('keybase')
  }
}

export function getCachedToken(voting: Voting): string | null {
  switch (voting.authorization) {
    case Authorization.KEYBASE:
      return getKeybaseToken(); // Keybase is a global token so no need to store it for each voting individually
    default:
      return null;
  }
}

