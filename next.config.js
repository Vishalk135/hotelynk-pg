/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Keep the native-capable `pg` driver out of the webpack bundle.
    serverComponentsExternalPackages: ["pg"],
  },
};

module.exports = nextConfig;
