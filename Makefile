lint:
	npm run lint

docker:
	docker build -t deetoreu/fitbit-ifttt-webhook-to-influx:latest .

docker-arm:
	docker buildx build --platform=linux/arm/v7 -t deetoreu/fitbit-ifttt-webhook-to-influx:latest .
