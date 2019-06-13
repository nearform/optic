const WebpackBeforeBuildPlugin = require('before-build-webpack')
const WorkboxWebpackPlugin = require('workbox-webpack-plugin')
const path = require('path')
const _ = require('lodash')
const fs = require('fs')

// from https://www.viget.com/articles/run-multiple-webpack-configs-sequentially/
class WaitPlugin extends WebpackBeforeBuildPlugin {
  constructor(file, interval = 100, timeout = 60e3) {
    super(function(stats, callback) {
      const start = Date.now()

      function poll() {
        if (fs.existsSync(file)) {
          callback()
        } else if (Date.now() - start > timeout) {
          throw Error(`Couldn't access ${file} within ${timeout}s`)
        } else {
          setTimeout(poll, interval)
        }
      }
      poll()
    })
  }
}

const swOutputName = 'custom-service-worker.js'
const workerSource = path.resolve(__dirname, 'src', 'workers', 'approval.js')

module.exports = {
  webpack: (config, env) => {
    // we need 2 webpack configurations:
    // 1- for the service worker file.
    //    it needs to be processed by webpack (to include 3rd party modules), and the output must be a
    //    plain, single file, not injected in the HTML page
    const swConfig = _.merge({}, config, {
      name: 'service worker',
      entry: workerSource,
      output: {
        filename: swOutputName
      },
      optimization: {
        splitChunks: false,
        runtimeChunk: false
      }
    })
    delete swConfig.plugins

    // 2- for the main application.
    //    we'll reuse configuration from create-react-app, without a specific Workbox configuration,
    //    so it could inject workbox-precache module and the computed manifest into the BUILT service-worker.js file.
    //    this require to WAIT for the first configuration to be finished
    if (env === 'production') {
      const builtWorkerPath = path.resolve(config.output.path, swOutputName)
      config.name = 'main-application'
      config.plugins.push(
        new WorkboxWebpackPlugin.InjectManifest({
          swSrc: builtWorkerPath,
          swDest: swOutputName
        }),
        new WaitPlugin(builtWorkerPath)
      )
    }

    // remove Workbox service-worker.js generator
    const removed = config.plugins.findIndex(
      ({ constructor: { name } }) => name === 'GenerateSW'
    )
    if (removed !== -1) {
      config.plugins.splice(removed, 1)
    }

    const result = [swConfig, config]
    // compatibility hack for CRA's build script to support multiple configurations
    // https://github.com/facebook/create-react-app/blob/master/packages/react-scripts/scripts/build.js#L119
    result.output = { publicPath: config.output.publicPath }
    return result
  }
}
