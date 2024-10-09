import { ValueType } from "@opentelemetry/api";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { Resource } from "@opentelemetry/resources";
import {
	ConsoleMetricExporter,
	MeterProvider,
	PeriodicExportingMetricReader,
} from "@opentelemetry/sdk-metrics";
import {
	ATTR_SERVICE_NAME,
	ATTR_SERVICE_VERSION,
	SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
	SEMRESATTRS_SERVICE_INSTANCE_ID,
	SEMRESATTRS_SERVICE_NAMESPACE,
} from "@opentelemetry/semantic-conventions";

main();

function main() {
	const exporter = new OTLPMetricExporter({
		headers: {
			"X-Scope-OrgID": "demo",
		},
	});

	const meterProvider = new MeterProvider({
		resource: new Resource({
			// サービス名を指定。サービス名は、どのサービスからメトリクスが送信されたかを識別するために使用される
			[ATTR_SERVICE_NAME]: "yamatatsu-test-service",
			[ATTR_SERVICE_VERSION]: "1.0.0",
			[SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: "test",
			[SEMRESATTRS_SERVICE_NAMESPACE]: "test_namespace",
			[SEMRESATTRS_SERVICE_INSTANCE_ID]: "a00b9193-2061-4cb1-9a0c-0ef63fd62c95",
		}),
		readers: [
			// TODO: 定期的なエクスポートは不要であるため、よりシンプルなReader実装を使用したい
			new PeriodicExportingMetricReader({
				exporter: exporter,
				exportIntervalMillis: 1000,
			}),
			new PeriodicExportingMetricReader({
				exporter: new ConsoleMetricExporter(),
				exportIntervalMillis: 1000,
			}),
		],
	});
	const meter = meterProvider.getMeter("example-prometheus", "1.1.0");

	const gauge = meter.createGauge("yamatatsutest", {
		description: "Example of a gauge",
		unit: "rpm",
		valueType: ValueType.DOUBLE,
	});

	const gaugeValue = sineWave(new Date());
	gauge.record(gaugeValue, {
		test_attribute_key: "test_attribute_value",
	});

	meterProvider.forceFlush();
}

function sineWave(date: Date) {
	const unixMs = date.getTime();
	const amplitude = 10;
	const period = 1000;
	const y = amplitude * Math.sin((2 * Math.PI * unixMs) / period);
	return round(y, 2);
}

function round(value: number, digit: number) {
	const ten = 10 ** digit;
	return Math.round(value * ten) / ten;
}
