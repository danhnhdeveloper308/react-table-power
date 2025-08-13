/**
 * Vite configuration helpers for react-table-power
 */

import { defineConfig, UserConfig } from 'vite';

export interface TablePowerViteConfig {
  // CSS optimization
  optimizeCSS?: boolean;
  
  // Bundle optimization
  treeshaking?: boolean;
  
  // Development options
  hmr?: boolean;
  
  // Build options
  minify?: boolean;
  sourcemap?: boolean;
}

/**
 * Create optimized Vite config for react-table-power
 */
export function createTablePowerViteConfig(
  baseConfig: UserConfig = {},
  options: TablePowerViteConfig = {}
): UserConfig {
  const {
    optimizeCSS = true,
    treeshaking = true,
    hmr = true,
    minify = true,
    sourcemap = false,
  } = options;

  return defineConfig({
    ...baseConfig,
    
    // Optimized dependencies
    optimizeDeps: {
      include: [
        '@tanstack/react-table',
        '@tanstack/react-virtual',
        'framer-motion',
        'clsx',
        'tailwind-merge',
        ...(baseConfig.optimizeDeps?.include || []),
      ],
      exclude: [
        // Exclude heavy dependencies that should be lazy-loaded
        'jspdf',
        'jspdf-autotable',
        'xlsx',
        'papaparse',
        ...(baseConfig.optimizeDeps?.exclude || []),
      ],
      ...baseConfig.optimizeDeps,
    },

    // Build configuration
    build: {
      ...baseConfig.build,
      
      // Enable tree shaking
      ...(treeshaking && {
        rollupOptions: {
          ...baseConfig.build?.rollupOptions,
          treeshake: true,
          output: {
            ...baseConfig.build?.rollupOptions?.output,
            manualChunks: {
              // Separate heavy dependencies into their own chunks
              'table-core': ['@tanstack/react-table'],
              'virtual': ['@tanstack/react-virtual'],
              'animation': ['framer-motion'],
              'export-libs': ['jspdf', 'jspdf-autotable', 'xlsx', 'papaparse'],
              ...(typeof baseConfig.build?.rollupOptions?.output === 'object' && 
                 'manualChunks' in baseConfig.build.rollupOptions.output
                ? baseConfig.build.rollupOptions.output.manualChunks
                : {}),
            },
          },
        },
      }),
      
      minify: minify ? 'esbuild' : false,
      sourcemap,
      
      // CSS optimization
      ...(optimizeCSS && {
        cssCodeSplit: true,
        cssMinify: true,
      }),
    },

    // Development server
    server: {
      ...baseConfig.server,
      hmr: hmr ? {
        overlay: true,
        ...baseConfig.server?.hmr,
      } : false,
    },

    // CSS processing
    css: {
      ...baseConfig.css,
      
      // PostCSS configuration for Tailwind and other processors
      postcss: {
        plugins: [
          // Add autoprefixer for better browser support
          require('autoprefixer'),
          ...(baseConfig.css?.postcss?.plugins || []),
        ],
        ...baseConfig.css?.postcss,
      },
      
      // CSS modules configuration
      modules: {
        localsConvention: 'camelCaseOnly',
        ...baseConfig.css?.modules,
      },
    },

    // Plugin configuration
    plugins: [
      ...(baseConfig.plugins || []),
      
      // Add React plugin if not already present
      ...(baseConfig.plugins?.some(p => p && typeof p === 'object' && 'name' in p && p.name === 'vite:react-jsx')
        ? []
        : [require('@vitejs/plugin-react')()]),
    ],

    // Define globals for better compatibility
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      ...baseConfig.define,
    },

    // Resolve configuration
    resolve: {
      ...baseConfig.resolve,
      
      alias: {
        // Add helpful aliases
        '@': '/src',
        '@components': '/src/components',
        '@hooks': '/src/hooks',
        '@utils': '/src/utils',
        '@types': '/src/types',
        ...baseConfig.resolve?.alias,
      },
    },
  });
}

/**
 * Preset configurations for common use cases
 */
export const vitePresets = {
  /**
   * Development preset with fast builds and HMR
   */
  development: createTablePowerViteConfig({}, {
    optimizeCSS: false,
    minify: false,
    sourcemap: true,
    hmr: true,
  }),

  /**
   * Production preset with optimizations
   */
  production: createTablePowerViteConfig({}, {
    optimizeCSS: true,
    treeshaking: true,
    minify: true,
    sourcemap: false,
    hmr: false,
  }),

  /**
   * Library development preset
   */
  library: createTablePowerViteConfig({
    build: {
      lib: {
        entry: 'src/index.ts',
        name: 'ReactTablePower',
        formats: ['es', 'cjs'],
      },
      rollupOptions: {
        external: ['react', 'react-dom'],
        output: {
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM',
          },
        },
      },
    },
  }, {
    treeshaking: true,
    minify: true,
  }),
};

/**
 * Helper for integrating with existing Vite configs
 */
export function withTablePowerOptimizations(
  existingConfig: UserConfig,
  options: TablePowerViteConfig = {}
): UserConfig {
  return createTablePowerViteConfig(existingConfig, options);
}
