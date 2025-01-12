const esbuild = require('esbuild');
const path = require('path');

esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  outfile: 'dist/index.js',
  external: ['axios', 'jsdom'],
  loader: {
    '.js': 'file',
  },
  plugins: [
    {
      name: 'resolve-xhr-sync-worker',
      setup(build) {
        build.onResolve({ filter: /xhr-sync-worker\.js$/ }, args => {
          return { path: path.resolve(args.resolveDir, args.path), external: false };
        });
      },
    },
  ],
}).catch(() => process.exit(1));
