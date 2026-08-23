/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',

  basePath: '/Noa',
  assetPrefix: '/Noa/',

  trailingSlash: true,

  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
