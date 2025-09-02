/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['@upstash/redis'],
  env: {
    KV_REST_API_URL: process.env.KV_REST_API_URL,
    KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }

    config.resolve.alias = {
      ...config.resolve.alias,
    };
    
    // 关键配置：忽略系统路径
    config.watchOptions = {
      ignored: [
        "**/node_modules/**",
        "**/.git/**",
        "D:\\DumpStack.log.tmp",
        "D:\\pagefile.sys",
        "D:\\System Volume Information",
        "C:\\swapfile.sys",
        "C:\\System Volume Information"
      ]
    };

    return config;
  },
  experimental: {
    optimizePackageImports: [],
  }
}

export default nextConfig