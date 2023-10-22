const path = require('path');

const outPath = path.resolve(__dirname, '.build');

module.exports = (_, { mode }) => {
    return {
        context: __dirname,
        entry: './src/main.ts',
        target: 'node',
        output: {
            filename: '[name].js',
            path: outPath,
            clean: true,
        },
        devtool: mode === 'development' ? 'source-map' : 'nosources-source-map',
        resolve: {
            extensions: ['.ts', '.js'],
        },
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    loader: 'ts-loader',
                    options: {
                        configFile: 'tsconfig.json',
                    },
                },
            ],
        },
    };
};
