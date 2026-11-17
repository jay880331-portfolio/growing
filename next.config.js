/** @type {import('next').NextConfig} */
const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

const nextConfig = {
  reactStrictMode: true,
  // The 'env' config is used to expose variables to the browser.
  // DO NOT expose sensitive keys like database connection strings or API keys here.
  // Server-side code can access environment variables directly via process.env.
  // For client-side variables, the recommended approach is to prefix them with NEXT_PUBLIC_.
  env: {
    // Example: AI_PROVIDER: process.env.AI_PROVIDER, // This is only safe if the value itself is not a secret.
  },
};

module.exports = withNextIntl(nextConfig);
