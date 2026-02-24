declare module 'node-quickbooks' {
  class QuickBooks {
    constructor(
      clientId: string,
      clientSecret: string,
      accessToken: string,
      useOAuth2: boolean,
      realmId: string,
      useSandbox: boolean,
      debug: boolean,
      minorVersion: number | null,
      oauthVersion: string,
      refreshToken: string
    )
    [key: string]: any
  }
  export = QuickBooks
}
