/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { domains: ["res.cloudinary.com", "localhost", "picsum.photos"] },
  reactStrictMode: true,
  webpack: (config, { webpack, buildId, isServer }) => {
    config.module.rules.push({
      test: /\.(graphql|gql)$/,
      exclude: /node_modules/,
      loader: require.resolve("graphql-tag/loader"),
    });

    return config;
  },
};

module.exports = nextConfig;
