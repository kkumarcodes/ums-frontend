const isTest = process.env.NODE_ENV === 'test'

module.exports = {
  presets: [
    [
      '@babel/env',
      {
        modules: isTest ? 'commonjs' : false,
        useBuiltIns: 'usage',
      },
    ],
    // "react"
    '@babel/preset-react',
    '@babel/preset-typescript',
  ],
  plugins: [
    // class { handleThing = () => { } }
    '@babel/proposal-class-properties',
    'add-module-exports',
    // "react-hot-loader/babel"
    // "@babel/polyfill"
  ],
}
