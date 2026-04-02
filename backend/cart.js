const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

let cart = [];

// POST /cart — add or increment item
app.post('/cart', (req, res) => {
  const { productId, name, price, quantity } = req.body;
  const existing = cart.find((item) => item.productId === productId);
  if (existing) {
    existing.quantity += quantity || 1;
  } else {
    cart.push({ productId, name, price, quantity: quantity || 1 });
  }
  res.json(cart);
});

// GET /cart — return cart
app.get('/cart', (req, res) => {
  res.json(cart);
});

// PUT /cart/:productId — update quantity; remove if <= 0
app.put('/cart/:productId', (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;
  const index = cart.findIndex((item) => item.productId === productId);
  if (index === -1) return res.status(404).json({ error: 'Item not found' });
  if (quantity <= 0) {
    cart.splice(index, 1);
  } else {
    cart[index].quantity = quantity;
  }
  res.json(cart);
});

// DELETE /cart/:productId — remove item
app.delete('/cart/:productId', (req, res) => {
  const { productId } = req.params;
  cart = cart.filter((item) => item.productId !== productId);
  res.json(cart);
});

app.listen(3003, () => console.log('Cart service running on port 3003'));
