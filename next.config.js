/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_WEBSOCKET_URL: process.env.NEXT_PUBLIC_WEBSOCKET_URL,
  },
}

module.exports = nextConfig
