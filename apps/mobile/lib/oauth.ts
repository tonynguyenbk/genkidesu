import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = process.env['EXPO_PUBLIC_GOOGLE_CLIENT_ID'] ?? '';
const FACEBOOK_APP_ID = process.env['EXPO_PUBLIC_FACEBOOK_APP_ID'] ?? '';

const googleDiscovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
};

const facebookDiscovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://www.facebook.com/v19.0/dialog/oauth',
};

export function useGoogleAuthRequest() {
  const redirectUri = AuthSession.makeRedirectUri();
  return AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID,
      scopes: ['openid', 'profile', 'email'],
      redirectUri,
      responseType: AuthSession.ResponseType.IdToken,
      usePKCE: false,
      extraParams: { nonce: Math.random().toString(36).slice(2) },
    },
    googleDiscovery,
  );
}

export function useFacebookAuthRequest() {
  const redirectUri = AuthSession.makeRedirectUri();
  return AuthSession.useAuthRequest(
    {
      clientId: FACEBOOK_APP_ID,
      scopes: ['public_profile', 'email'],
      redirectUri,
      responseType: AuthSession.ResponseType.Token,
      usePKCE: false,
    },
    facebookDiscovery,
  );
}

export function isGoogleConfigured(): boolean {
  return GOOGLE_CLIENT_ID.length > 0;
}

export function isFacebookConfigured(): boolean {
  return FACEBOOK_APP_ID.length > 0;
}
