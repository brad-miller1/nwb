import path from 'path'

import cleanUMD from './commands/clean-umd'
import {REACT_COMPONENT} from './constants'
import getUserConfig from './getUserConfig'
import {UserError} from './errors'
import {createBanner, createWebpackExternals} from './utils'
import webpackBuild from './webpackBuild'

/**
 * Create a module's UMD builds.
 */
export default function umdBuild(args, babelConfig, cb) {
  let pkg = require(path.resolve('package.json'))
  let userConfig = getUserConfig(args)

  if (!userConfig.npm.umd) {
    return cb(new UserError(
      "nwb: the UMD build for this module hasn't been configured in your nwb config file"
    ))
  }

  let babel = {}
  if (userConfig.type === REACT_COMPONENT) {
    babel.presets = ['react']
  }

  let entry = path.resolve(args._[1] || 'src/index.js')
  let buildConfig = {
    babel,
    entry: [entry],
    output: {
      filename: `${pkg.name}.js`,
      library: userConfig.npm.umd.global,
      libraryTarget: 'umd',
      path: path.resolve('umd'),
    },
    externals: createWebpackExternals(userConfig.npm.externals),
    polyfill: false,
    plugins: {
      banner: createBanner(pkg),
    },
  }

  cleanUMD(args)

  console.log('nwb: build-umd')
  process.env.NODE_ENV = 'development'
  webpackBuild(args, buildConfig, err => {
    if (err) return cb(err)
    process.env.NODE_ENV = 'production'
    buildConfig.devtool = 'source-map'
    buildConfig.output.filename = `${pkg.name}.min.js`
    webpackBuild(args, buildConfig, cb)
  })
}