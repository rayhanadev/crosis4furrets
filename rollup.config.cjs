const graphql = require('@rollup/plugin-graphql');
const typescript = require('@rollup/plugin-typescript');
const sourcemaps = require('rollup-plugin-sourcemaps');
const { babel } = require('@rollup/plugin-babel');
const { nodeResolve: resolve } = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const { terser } = require('rollup-plugin-terser');
const dts = require('rollup-plugin-dts').default;
const del = require('rollup-plugin-delete');

const { builtinModules } = require('module');
const { dependencies } = require('./package.json');

module.exports = [
	{
		input: 'src/index.ts',
		output: [
			{
				file: `dist/index.cjs`,
				format: 'cjs',
				preferConst: true,
				sourcemap: true,
			},
			{
				file: `dist/index.mjs`,
				format: 'esm',
				preferConst: true,
				sourcemap: true,
			},
		],
		plugins: [
			graphql(),
			typescript({ tsconfig: './tsconfig.json' }),
			// sourcemaps(),
			babel({
				babelHelpers: 'bundled',
				exclude: '**/node_modules/**',
			}),
			resolve(),
			commonjs(),
			// terser(),
		],
		external: [
			...builtinModules,
			...Object.keys(dependencies),
			'node:buffer',
		],
	},
	{
		input: 'dist/index.d.ts',
		output: [{ file: 'dist/index.d.ts', format: 'es' }],
		plugins: [
			dts(),
			del({ hook: 'buildEnd', targets: ['./dist/dts/', './dist/lib/'] }),
		],
		external: [
			...builtinModules,
			...Object.keys(dependencies),
			'node:buffer',
			'node:fs',
		],
	},
];
