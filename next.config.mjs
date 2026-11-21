/** @type {import('next').NextConfig} */
const nextConfig = {
  // Assets are pre-sliced and sized by scripts/slice-assets.mjs.
  images: { unoptimized: true },
};
export default nextConfig;