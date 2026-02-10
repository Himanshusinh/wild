const net = require('net');

const client = new net.Socket();
const port = 5000;
const host = 'localhost';

console.log(`Checking connection to ${host}:${port}...`);

client.connect(port, host, () => {
  console.log(`Connected to ${host}:${port} successfully! Backend is running.`);
  client.end();
});

client.on('error', (err) => {
  console.error(`Connection failed: ${err.message}`);
  console.error('Backend likely NOT running or blocked.');
});

client.on('close', () => {
  console.log('Connection closed');
});
