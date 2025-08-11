/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
  },
  eslint: {
    // CI runs eslint separately; avoid failing Next build on lint
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
