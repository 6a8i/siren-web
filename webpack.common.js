const fg = require('fast-glob');
const fs = require('fs');
const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { DefinePlugin, IgnorePlugin } = require('webpack');
const packageJson = require('./package.json');

const Assets = [
    'native-promise-only/npo.js',
    'libarchive.js/dist/worker-bundle.js',
    'libarchive.js/dist/libarchive.wasm',
    '@jellyfin/libass-wasm/dist/js/default.woff2',
    '@jellyfin/libass-wasm/dist/js/subtitles-octopus-worker.js',
    '@jellyfin/libass-wasm/dist/js/subtitles-octopus-worker.wasm',
    '@jellyfin/libass-wasm/dist/js/subtitles-octopus-worker-legacy.js',
    'pdfjs-dist/build/pdf.worker.js'
];

const DEV_MODE = process.env.NODE_ENV !== 'production';
let COMMIT_SHA = '';
try {
    COMMIT_SHA = require('child_process')
        // eslint-disable-next-line sonarjs/no-os-command-from-path
        .execSync('git describe --always --dirty')
        .toString()
        .trim();
} catch (err) {
    console.warn('Failed to get commit sha. Is git installed?', err);
}

const NODE_MODULES_REGEX = /[\\/]node_modules[\\/]/;

// webpack resolves every module to its real path, so when node_modules is a link (a git worktree sharing
// one install, pnpm) the babel include list below has to point at the real directory or it matches nothing.
const NODE_MODULES_DIR = fs.realpathSync(path.resolve(__dirname, 'node_modules'));
const nodeModule = name => path.join(NODE_MODULES_DIR, name);

const THEMES = fg.globSync('themes/**/*.scss', { cwd: path.resolve(__dirname, 'src') });
const THEMES_BY_ID = THEMES.reduce((acc, theme) => {
    acc[theme.substring(0, theme.lastIndexOf('/'))] = `./${theme}`;
    return acc;
}, {});

const config = {
    context: path.resolve(__dirname, 'src'),
    target: 'browserslist',
    entry: {
        'main.jellyfin': './index.jsx',
        ...THEMES_BY_ID
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        modules: [
            path.resolve(__dirname, 'src'),
            path.resolve(__dirname, 'node_modules')
        ]
    },
    plugins: [
        new DefinePlugin({
            __COMMIT_SHA__: JSON.stringify(COMMIT_SHA),
            __JF_BUILD_VERSION__: JSON.stringify(
                process.env.WEBPACK_SERVE ?
                    'Dev Server' :
                    process.env.JELLYFIN_VERSION || 'Release'),
            __PACKAGE_JSON_NAME__: JSON.stringify(packageJson.name),
            __PACKAGE_JSON_VERSION__: JSON.stringify(packageJson.version),
            __USE_SYSTEM_FONTS__: !!JSON.parse(process.env.USE_SYSTEM_FONTS || '0'),
            __WEBPACK_SERVE__: !!JSON.parse(process.env.WEBPACK_SERVE || '0')
        }),
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: 'index.html',
            // Append file hashes to bundle urls for cache busting
            hash: true,
            chunks: [
                'main.jellyfin',
                'serviceworker'
            ]
        }),
        new CopyPlugin({
            patterns: [
                {
                    from: 'assets',
                    to: 'assets'
                },
                'config.json',
                'robots.txt',
                {
                    from: 'favicons',
                    to: 'favicons'
                },
                ...Assets.map(asset => {
                    return {
                        from: path.resolve(__dirname, `node_modules/${asset}`),
                        to: 'libraries'
                    };
                })
            ]
        }),
        // The libarchive.js worker-bundle is copied manually.
        // If it is automatically bundled, escheck will fail since it uses import.meta.url.
        new IgnorePlugin({
            resourceRegExp: /worker-bundle\.js$/,
            contextRegExp: /libarchive.js/
        }),
        new ForkTsCheckerWebpackPlugin({
            typescript: {
                configFile: path.resolve(__dirname, 'tsconfig.json')
            }
        }),
        new MiniCssExtractPlugin({
            filename: pathData => {
                if (pathData.chunk?.name?.startsWith('themes/')) {
                    return '[name]/theme.css';
                }
                return '[name].[contenthash].css';
            },
            chunkFilename: '[name].[contenthash].css'
        })
    ],
    output: {
        filename: pathData => (
            pathData.chunk.name === 'serviceworker' ? '[name].js' : '[name].bundle.js'
        ),
        chunkFilename: '[name].[contenthash].chunk.js',
        assetModuleFilename: pathData => {
            if (pathData.filename === 'manifest.json') {
                return '[base]';
            }
            if (pathData.filename.startsWith('assets/') || pathData.filename.startsWith('themes/')) {
                return '[path][base][query]';
            }
            return '[name].[hash][ext][query]';
        },
        path: path.resolve(__dirname, 'dist'),
        publicPath: ''
    },
    optimization: {
        runtimeChunk: 'single',
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: {
            chunks: 'all',
            maxInitialRequests: Infinity,
            cacheGroups: {
                node_modules: {
                    test(module) {
                        return NODE_MODULES_REGEX.test(module.context);
                    },
                    name(module) {
                        // get the name. E.g. node_modules/packageName/not/this/part.js
                        // or node_modules/packageName
                        const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
                        // if "packageName" is a namespace (i.e. @jellyfin) get the namespace + packageName
                        if (packageName.startsWith('@')) {
                            const parts = module.context
                                .substring(module.context.lastIndexOf(packageName))
                                .split(/[\\/]/);
                            return `node_modules.${parts[0]}.${parts[1]}`;
                        }

                        if (packageName === 'date-fns') {
                            const parts = module.context
                                .substring(module.context.lastIndexOf(packageName))
                                .split(/[\\/]/);

                            let name = `node_modules.${parts[0]}`;
                            if (parts[1]) {
                                name += `.${parts[1]}`;

                                if (parts[1] === 'locale' && parts[2]) {
                                    name += `.${parts[2]}`;
                                }
                            }

                            return name;
                        }

                        return `node_modules.${packageName}`;
                    }
                }
            }
        }
    },
    module: {
        rules: [
            {
                test: /\.(html)$/,
                use: {
                    loader: 'html-loader'
                }
            },
            {
                test: /\.(js|jsx|mjs)$/,
                include: [
                    nodeModule('@jellyfin/libass-wasm'),
                    nodeModule('@jellyfin/sdk'),
                    nodeModule('@mui/base'),
                    nodeModule('@mui/lab'),
                    nodeModule('@mui/material'),
                    nodeModule('@mui/private-theming'),
                    nodeModule('@mui/styled-engine'),
                    nodeModule('@mui/system'),
                    nodeModule('@mui/utils'),
                    nodeModule('@mui/x-date-pickers'),
                    nodeModule('@react-hook/latest'),
                    nodeModule('@react-hook/passive-layout-effect'),
                    nodeModule('@react-hook/resize-observer'),
                    nodeModule('@remix-run/router'),
                    nodeModule('@tanstack/match-sorter-utils'),
                    nodeModule('@tanstack/query-core'),
                    nodeModule('@tanstack/query-persist-client-core'),
                    nodeModule('@tanstack/react-query'),
                    nodeModule('@tanstack/react-table'),
                    nodeModule('@tanstack/react-virtual'),
                    nodeModule('@tanstack/table-core'),
                    nodeModule('@tanstack/virtual-core'),
                    nodeModule('@uupaa/dynamic-import-polyfill'),
                    nodeModule('axios'),
                    nodeModule('blurhash'),
                    nodeModule('compare-versions'),
                    nodeModule('date-fns'),
                    nodeModule('dom7'),
                    nodeModule('epubjs'),
                    nodeModule('flv.js'),
                    nodeModule('highlight-words'),
                    nodeModule('idb-keyval'),
                    nodeModule('libarchive.js'),
                    nodeModule('libbitsub'),
                    nodeModule('linkify-it'),
                    nodeModule('markdown-it'),
                    nodeModule('material-react-table'),
                    nodeModule('mdurl'),
                    nodeModule('punycode'),
                    nodeModule('react-blurhash'),
                    nodeModule('react-lazy-load-image-component'),
                    nodeModule('react-router'),
                    nodeModule('remove-accents'),
                    nodeModule('screenfull'),
                    nodeModule('ssr-window'),
                    nodeModule('swiper'),
                    nodeModule('usehooks-ts'),
                    path.resolve(__dirname, 'src')
                ],
                use: [{
                    loader: 'babel-loader',
                    options: {
                        cacheCompression: false,
                        cacheDirectory: true
                    }
                }]
            },
            // Strict EcmaScript modules require additional flags
            {
                test: /\.(js|jsx|mjs)$/,
                include: [
                    nodeModule('@tanstack/query-devtools')
                ],
                resolve: {
                    fullySpecified: false
                },
                use: [{
                    loader: 'babel-loader',
                    options: {
                        cacheCompression: false,
                        cacheDirectory: true
                    }
                }]
            },
            {
                test: /\.worker\.ts$/,
                exclude: /node_modules/,
                use: [
                    'worker-loader',
                    {
                        loader: 'ts-loader',
                        options: {
                            transpileOnly: true
                        }
                    }
                ]
            },
            {
                test: /\.(ts|tsx)$/,
                exclude: /node_modules/,
                use: [{
                    loader: 'ts-loader',
                    options: {
                        transpileOnly: true
                    }
                }]
            },
            /* modules that Babel breaks when transforming to ESM */
            {
                test: /\.js$/,
                include: [
                    nodeModule('pdfjs-dist'),
                    nodeModule('xmldom')
                ],
                use: [{
                    loader: 'babel-loader',
                    options: {
                        cacheCompression: false,
                        cacheDirectory: true,
                        plugins: [
                            '@babel/transform-modules-umd'
                        ]
                    }
                }]
            },
            {
                test: /\.(sa|sc|c)ss$/i,
                oneOf: [
                    {
                        // Themes always need to use the MiniCssExtractPlugin since they are loaded directly
                        include: [
                            path.resolve(__dirname, 'src/themes/')
                        ],
                        use: [
                            {
                                loader: MiniCssExtractPlugin.loader,
                                options: {
                                    publicPath: '../../'
                                }
                            },
                            'css-loader',
                            {
                                loader: 'postcss-loader',
                                options: {
                                    postcssOptions: {
                                        config: path.resolve(__dirname, 'postcss.config.js')
                                    }
                                }
                            },
                            'sass-loader'
                        ]
                    },
                    {
                        use: [
                            DEV_MODE ? 'style-loader' : MiniCssExtractPlugin.loader,
                            'css-loader',
                            {
                                loader: 'postcss-loader',
                                options: {
                                    postcssOptions: {
                                        config: path.resolve(__dirname, 'postcss.config.js')
                                    }
                                }
                            },
                            'sass-loader'
                        ]
                    }
                ]
            },
            {
                test: /\.(ico|png|jpg|gif|svg)$/i,
                type: 'asset/resource'
            },
            {
                test: /\.(woff|woff2|eot|ttf|otf)$/,
                type: 'asset/resource'
            },
            {
                test: /\.(mp3)$/i,
                type: 'asset/resource'
            },
            {
                test: require.resolve('jquery'),
                loader: 'expose-loader',
                options: {
                    exposes: ['$', 'jQuery']
                }
            }
        ]
    }
};

module.exports = config;
