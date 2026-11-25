/** Set STATIC_EXPORT=1 (see `npm run build:static`) to write a plain static site to out/, for hosts such as Cloudflare Pages.
 *  The default build is unchanged. A static site has no server, so the /api routes are not served there; the game does not use them.
 *  To host the site in a sub-folder (for example https://example.com/game/), also set STATIC_BASE_PATH=/game. */
const staticExport = process.env.STATIC_EXPORT === '1';
const basePath = staticExport ? (process.env.STATIC_BASE_PATH ?? '').replace(/\/+$/, '') : '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Assets are pre-sliced and sized by scripts/slice-assets.mjs.
  images: { unoptimized: true },
  // next/image does not add the base path to unoptimized images, so src/lib/assets.ts reads it from here.
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  ...(staticExport ? { output: 'export', trailingSlash: true, basePath } : {}),
};
export default nextConfig;