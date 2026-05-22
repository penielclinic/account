/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Electron 환경에서 절대 경로 문제 방지
  assetPrefix: process.env.NODE_ENV === 'production' ? '.' : '',
};

module.exports = nextConfig;
