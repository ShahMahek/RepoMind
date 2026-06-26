/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['avatars.githubusercontent.com'],
  },
  async rewrites() {
    return process.env.NODE_ENV === 'production' ? [] : [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8080/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;