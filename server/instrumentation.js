const { NodeSDK } = require('@opentelemetry/sdk-node')
const {
  getNodeAutoInstrumentations
} = require('@opentelemetry/auto-instrumentations-node')
const { PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics')
const {
  OTLPTraceExporter
} = require('@opentelemetry/exporter-trace-otlp-proto')
const {
  OTLPMetricExporter
} = require('@opentelemetry/exporter-metrics-otlp-proto')
const {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION
} = require('@opentelemetry/semantic-conventions')
const {
  Resource,
  envDetector,
  processDetector,
  hostDetector
} = require('@opentelemetry/resources')
const { diag, DiagLogLevel, DiagConsoleLogger } = require('@opentelemetry/api')

const pkg = require('../package.json')

require('dotenv').config()

const instrumentationEnabled =
  process.env.GRAFANA_INSTRUMENTATION_ENABLED !== false // default to true
const diagnosticsEnabled = process.env.GRAFANA_DIAGNOSTICS_ENABLED === true // default to false
const endpoint = process.env.GRAFANA_OTLP_ENDPOINT
const instanceId = process.env.GRAFANA_INSTANCE_ID
const apiKey = process.env.GRAFANA_API_KEY
const environment = process.env.GRAFANA_ENVIRONMENT ?? 'development'

if (!instrumentationEnabled) {
  console.warn('Grafana instrumentation disabled, skipping.')
  process.exit(0)
}

if (!endpoint || !instanceId || !apiKey) {
  throw new Error(
    'Grafana instrumentation requires endpoint, instance id and api key.'
  )
}

console.log(
  `Starting Grafana instrumentation on '${endpoint}', instance '${instanceId}'...`
)

const base64Key = Buffer.from(`${instanceId}:${apiKey}`).toString('base64')

const sdk = new NodeSDK({
  resource: new Resource({
    [ATTR_SERVICE_NAME]: 'optic',
    [ATTR_SERVICE_VERSION]: pkg.version,
    'deployment.environment': environment
  }),
  resourceDetectors: [envDetector, processDetector, hostDetector],
  traceExporter: new OTLPTraceExporter({
    url: `${endpoint}/v1/traces`,
    headers: {
      Authorization: `Basic ${base64Key}`
    }
  }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: `${endpoint}/v1/metrics`,
      headers: {
        Authorization: `Basic ${base64Key}`
      }
    })
  }),
  instrumentations: [getNodeAutoInstrumentations()]
})

sdk.start()

if (diagnosticsEnabled) {
  console.log('Grafana OTLP diagnostics enabled.')
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.VERBOSE)
}

console.log(
  `Grafana instrumentation started successfully on '${endpoint}', instance '${instanceId}'.`
)
