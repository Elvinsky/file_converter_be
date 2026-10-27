export type AccessTokenPayload = {
  sub: string;
  email: string;
  type: 'access';
  ver: number;
};

export type RefreshTokenPayload = {
  sub: string;
  type: 'refresh';
  ver: number;
};

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

export type AuthUserPayload = {
  id: string;
  email: string;
};
