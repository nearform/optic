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

require('dotenv').config()

if (
  !process.env.GRAFANA_OTLP_ENDPOINT ||
  !process.env.GRAFANA_INSTANCE_ID ||
  !process.env.GRAFANA_API_KEY
) {
  console.error('Grafana instrumentation not fully configured, skipping.')
  process.exit(0)
}

const base64Key = Buffer.from(
  `${process.env.GRAFANA_INSTANCE_ID}:${process.env.GRAFANA_API_KEY}`
).toString('base64')

const sdk = new NodeSDK({
  resource: new Resource({
    [ATTR_SERVICE_NAME]: 'optic',
    [ATTR_SERVICE_VERSION]: '1.0'
  }),
  resourceDetectors: [envDetector, processDetector, hostDetector],
  traceExporter: new OTLPTraceExporter({
    url: `${process.env.GRAFANA_OTLP_ENDPOINT}/v1/traces`,
    headers: {
      Authorization: `Basic ${base64Key}`
    }
  }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: `${process.env.GRAFANA_OTLP_ENDPOINT}/v1/metrics`,
      headers: {
        Authorization: `Basic ${base64Key}`
      }
    })
  }),
  instrumentations: [getNodeAutoInstrumentations()]
})

sdk.start()
