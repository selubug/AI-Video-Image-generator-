/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  env: {
    PIAPI_API_KEY: process.env.PIAPI_API_KEY,
    RUNWAY_ML_API_SECRET: process.env.RUNWAY_ML_API_SECRET,
  },
};

module.exports = nextConfig; 