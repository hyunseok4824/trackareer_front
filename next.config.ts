/** @type {import('next').NextConfig} */
const nextConfig = {
  // Firebase를 서버 번들링에서 제외하여 Edge/Workers Runtime의 eval 제한과 충돌 방지
  serverExternalPackages: ['firebase'],
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  },
};

export default nextConfig;
