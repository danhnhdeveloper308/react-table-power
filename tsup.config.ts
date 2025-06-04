import { defineConfig } from 'tsup';
import { execSync } from 'child_process';

export default defineConfig({
  // Thêm các entry points cho client và nextjs
  entry: ['src/index.ts', 'src/styles.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: false,
  clean: true,
  outDir: 'dist',
  external: ['react', 'react-dom'],
  
  // Đảm bảo CSS không được bundle trực tiếp vào JS
  treeshake: true,
  
  // Xử lý CSS một cách riêng biệt
  esbuildPlugins: [
    {
      name: 'ignore-css',
      setup(build) {
        // Đánh dấu CSS files là external để xử lý sau
        build.onResolve({ filter: /\.css$/ }, args => {
          return { path: args.path, external: true }
        })
      }
    }
  ],
  
  // Đặt đúng phần mở rộng cho output files
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.mjs',
    };
  },
  
  esbuildOptions(options) {
    // Đánh dấu React là external để tránh các vấn đề bundling
    options.external = [
      ...new Set([
        ...(options.external || []), 
        'react', 
        'react-dom', 
        'react/jsx-runtime',
        // Bỏ qua các CSS files
        '*.css'
      ])
    ];
    
    // Đảm bảo JSX runtime được xử lý đúng
    options.jsx = 'automatic';
  },
  
  // Chạy script build-fix.js sau khi build hoàn thành
  onSuccess: async () => {
    try {
      console.log('🔍 Build completed, running post-build CSS processing...');
      execSync('node build-fix.js', { stdio: 'inherit' });
    } catch (error) {
      console.error('⚠️ Post-build processing failed:', error);
      // Không làm fail quá trình build, chỉ hiển thị cảnh báo
    }
  },
});