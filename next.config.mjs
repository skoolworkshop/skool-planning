/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "skoolworkshop.nl" }, { protocol: "https", hostname: "www.skoolworkshop.nl" }],
  },
};
export default nextConfig;
