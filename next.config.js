/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'graph.facebook.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'your-storage-domain.com',
        pathname: '/profile-pictures/**',
      },
      ...(process.env.NODE_ENV === 'development'
        ? [{
            protocol: 'http',
            hostname: 'localhost',
            pathname: '/**',
          }]
        : []),
    ],
    domains: ['cdn.jsdelivr.net'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
  output: 'standalone',
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      use: ['raw-loader']
    });
    // Add JSON loader for contract ABIs
    config.module.rules.push({
      test: /\.json$/,
      type: 'json',
    });
    return config;
  },
  experimental: {
    appDir: true,
  },
  pwa: {
    dest: 'public',
    register: true,
    skipWaiting: true,
  },
};

module.exports = nextConfig;