const express = require('express');
const cors = require('cors');
const proxy = require('express-http-proxy');

const app = express();
app.use(cors());

app.use('/products', proxy('http://localhost:3002'));
app.use('/cart', proxy('http://localhost:3003'));

app.listen(3000, () => console.log('API Gateway running on port 3000'));
