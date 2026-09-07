export type AccessTokenPayload = {
  sub: string;
  email: string;
  role: string;
  type: 'access';
};

export type RefreshTokenPayload = {
  sub: string;
  type: 'refresh';
};

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

export type AuthUserPayload = {
  id: string;
  email: string;
  role: string;
};
