module.exports = {
    babelrcRoots: [
        // Keep the root as a root
        '.'
    ],
    sourceType: 'unambiguous',
    presets: [
        [
            '@babel/preset-env',
            {
                // Without this, one engine bug (e.g. Safari's tagged-template caching) makes preset-env
                // downlevel the whole feature for every target; with it only the buggy form is rewritten.
                bugfixes: true,
                useBuiltIns: 'usage',
                corejs: 3
            }
        ],
        '@babel/preset-react'
    ],
    plugins: [
    ]
};
