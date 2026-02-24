/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Allow server-side packages that use native bindings / CommonJS
    serverComponentsExternalPackages: ['plaid', 'intuit-oauth', 'node-quickbooks'],
  },
}

module.exports = nextConfig
