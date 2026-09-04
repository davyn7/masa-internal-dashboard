/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  transpilePackages: [
    'three',
    '@react-three/fiber',
    '@react-three/drei',
    'cesium',
  ],
  // Next.js 16 defaults to Turbopack; keep an empty turbopack block so any
  // future webpack-only plugins do not block builds.
  turbopack: {},
}

export default nextConfig
