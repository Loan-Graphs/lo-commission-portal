declare module 'intuit-oauth' {
  interface OAuthClientOptions {
    clientId: string
    clientSecret: string
    environment: string
    redirectUri: string
  }

  interface OAuthToken {
    access_token: string
    refresh_token: string
    expires_in?: number
    realmId?: string
    token_type?: string
  }

  class OAuthClient {
    static scopes: {
      Accounting: string
      Payment: string
      Payroll: string
      TimeTracking: string
      Benefits: string
      Profile: string
      Email: string
      Phone: string
      Address: string
      OpenId: string
      Intuit_name: string
    }

    constructor(options: OAuthClientOptions)

    authorizeUri(options: { scope: string[]; state?: string }): string
    createToken(url: string): Promise<this>
    refresh(): Promise<this>
    getToken(): OAuthToken
    setToken(token: Partial<OAuthToken>): this
    isAccessTokenValid(): boolean
    loadResponse(response: any): this
  }

  export = OAuthClient
}
