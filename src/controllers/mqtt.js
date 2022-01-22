//MQTT
const mqtt = require('mqtt');
const host = 'localhost';
const mqttPort = '1883';

const circuitFaultTopic = '/team13/circuitFault';

let isBookingCircuitOpen = false;

const connectUrl = `mqtt://${host}:${mqttPort}`;
const client = mqtt.connect(connectUrl, {
    clean: true,
    connectTimeout: 4000,
    reconnectPeriod: 1000,
});

client.on('connect', () => {
    console.log('Connected');
    // We want to be subscribed to the fault topic to know when the circuit breaker is open/closed.
    client.subscribe(circuitFaultTopic, () =>{
        console.log(`Subscribed to topic: ${circuitFaultTopic}`);
    });
});

client.on('message', (topic, payload) => {
    console.log('Received Message:', topic, payload.toString());

    // This ensures that the status of the circuit being closed/open is always up to date.
    if (topic === circuitFaultTopic) {
        isBookingCircuitOpen = (payload.toString() === 'true');
    }
});

// This was made to allow other components to retreive circuit status
function isCircuitBreakerOpen(){
    return isBookingCircuitOpen;
}

function publish(topic, payload) {
    client.publish(topic, payload, { qos: 1, retain: false }, (error) => {
        if (error) {
            console.error(error);
        }
    });
}
module.exports = { publish, isCircuitBreakerOpen };
