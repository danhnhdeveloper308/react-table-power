/**
 * Next.js configuration helpers for react-table-power
 */

import type { NextConfig } from 'next';

export interface TablePowerNextConfig {
  // SSR options
  ssr?: boolean;
  
  // Bundle optimization
  optimization?: {
    splitChunks?: boolean;
    treeshaking?: boolean;
    minify?: boolean;
  };
  
  // CSS options
  css?: {
    modules?: boolean;
    optimization?: boolean;
  };
  
  // Experimental features
  experimental?: {
    turbo?: boolean;
    appDir?: boolean;
  };
}

/**
 * Create optimized Next.js config for react-table-power
 */
export function createTablePowerNextConfig(
  baseConfig: NextConfig = {},
  options: TablePowerNextConfig = {}
): NextConfig {
  const {
    ssr = true,
    optimization = {
      splitChunks: true,
      treeshaking: true,
      minify: true,
    },
    css = {
      modules: false,
      optimization: true,
    },
    experimental = {},
  } = options;

  return {
    ...baseConfig,

    // React configuration
    reactStrictMode: baseConfig.reactStrictMode ?? true,

    // SWC configuration for better performance
    swcMinify: optimization.minify ?? true,

    // Experimental features
    experimental: {
      ...baseConfig.experimental,
      ...experimental,
      
      // Enable modern features
      esmExternals: true,
      serverComponentsExternalPackages: [
        // Exclude heavy packages from server bundle
        'jspdf',
        'jspdf-autotable',
        'xlsx',
        'papaparse',
        ...(baseConfig.experimental?.serverComponentsExternalPackages || []),
      ],
    },

    // Webpack configuration
    webpack: (config, context) => {
      // Apply base webpack config if it exists
      if (baseConfig.webpack) {
        config = baseConfig.webpack(config, context);
      }

      // Add optimization for react-table-power
      if (optimization.splitChunks) {
        config.optimization = config.optimization || {};
        config.optimization.splitChunks = {
          ...config.optimization.splitChunks,
          chunks: 'all',
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            
            // Separate react-table-power and its dependencies
            tableCore: {
              test: /[\\/]node_modules[\\/]@tanstack[\\/]react-table/,
              name: 'table-core',
              chunks: 'all',
              priority: 30,
            },
            
            virtualCore: {
              test: /[\\/]node_modules[\\/]@tanstack[\\/]react-virtual/,
              name: 'virtual-core',
              chunks: 'all',
              priority: 30,
            },
            
            animation: {
              test: /[\\/]node_modules[\\/]framer-motion/,
              name: 'animation',
              chunks: 'all',
              priority: 25,
            },
            
            exportLibs: {
              test: /[\\/]node_modules[\\/](jspdf|xlsx|papaparse)/,
              name: 'export-libs',
              chunks: 'async', // Lazy load these heavy libraries
              priority: 20,
            },
          },
        };
      }

      // Tree shaking optimization
      if (optimization.treeshaking) {
        config.optimization.usedExports = true;
        config.optimization.sideEffects = false;
      }

      // Resolve configuration
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...config.resolve.alias,
        
        // Add helpful aliases
        '@/components': 'src/components',
        '@/hooks': 'src/hooks',
        '@/utils': 'src/utils',
        '@/types': 'src/types',
      };

      // Handle CSS modules if enabled
      if (css.modules) {
        const cssModuleRegex = /\.module\.(css|scss|sass)$/;
        
        config.module.rules.push({
          test: cssModuleRegex,
          use: [
            'style-loader',
            {
              loader: 'css-loader',
              options: {
                modules: {
                  localIdentName: '[name]__[local]__[hash:base64:5]',
                },
              },
            },
          ],
        });
      }

      return config;
    },

    // Transpile react-table-power for better compatibility
    transpilePackages: [
      'react-table-power',
      ...(baseConfig.transpilePackages || []),
    ],

    // Image optimization
    images: {
      ...baseConfig.images,
      domains: [
        ...(baseConfig.images?.domains || []),
        // Add any domains needed for table assets
      ],
    },

    // Headers for better performance
    async headers() {
      const baseHeaders = baseConfig.headers ? await baseConfig.headers() : [];
      
      return [
        ...baseHeaders,
        {
          source: '/(.*)',
          headers: [
            {
              key: 'X-Content-Type-Options',
              value: 'nosniff',
            },
            {
              key: 'X-Frame-Options',
              value: 'DENY',
            },
            {
              key: 'X-XSS-Protection',
              value: '1; mode=block',
            },
          ],
        },
      ];
    },

    // Redirects for better SEO
    async redirects() {
      const baseRedirects = baseConfig.redirects ? await baseConfig.redirects() : [];
      return baseRedirects;
    },

    // Rewrites for API routes
    async rewrites() {
      const baseRewrites = baseConfig.rewrites ? await baseConfig.rewrites() : [];
      return baseRewrites;
    },
  };
}

/**
 * Preset configurations for common Next.js use cases
 */
export const nextjsPresets = {
  /**
   * App Router preset with modern features
   */
  appRouter: createTablePowerNextConfig({}, {
    ssr: true,
    experimental: {
      appDir: true,
    },
    optimization: {
      splitChunks: true,
      treeshaking: true,
      minify: true,
    },
  }),

  /**
   * Pages Router preset for traditional Next.js apps
   */
  pagesRouter: createTablePowerNextConfig({}, {
    ssr: true,
    experimental: {
      appDir: false,
    },
    optimization: {
      splitChunks: true,
      treeshaking: true,
      minify: true,
    },
  }),

  /**
   * Static export preset for static sites
   */
  staticExport: createTablePowerNextConfig({
    trailingSlash: true,
    output: 'export',
  }, {
    ssr: false,
    optimization: {
      splitChunks: false,
      treeshaking: true,
      minify: true,
    },
  }),

  /**
   * Development preset with fast refresh
   */
  development: createTablePowerNextConfig({}, {
    ssr: true,
    optimization: {
      splitChunks: false,
      treeshaking: false,
      minify: false,
    },
  }),
};

/**
 * Helper for integrating with existing Next.js configs
 */
export function withTablePowerOptimizations(
  existingConfig: NextConfig,
  options: TablePowerNextConfig = {}
): NextConfig {
  return createTablePowerNextConfig(existingConfig, options);
}

/**
 * Utility for checking Next.js version compatibility
 */
export function checkNextJSCompatibility(): {
  isCompatible: boolean;
  version?: string;
  recommendations?: string[];
} {
  try {
    const nextPackage = require('next/package.json');
    const version = nextPackage.version;
    const majorVersion = parseInt(version.split('.')[0], 10);
    
    const recommendations: string[] = [];
    
    if (majorVersion < 13) {
      recommendations.push('Consider upgrading to Next.js 13+ for better performance');
      recommendations.push('App Router features require Next.js 13.4+');
    }
    
    if (majorVersion < 12) {
      return {
        isCompatible: false,
        version,
        recommendations: [
          'Next.js 12+ is required for react-table-power',
          'Please upgrade your Next.js version',
        ],
      };
    }
    
    return {
      isCompatible: true,
      version,
      recommendations,
    };
  } catch {
    return {
      isCompatible: false,
      recommendations: ['Next.js is not installed or not detected'],
    };
  }
}
