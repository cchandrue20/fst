const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/productdb');

const Product = mongoose.model('Product', {
  name: String,
  price: Number,
  description: String,
  stock: Number,
  image: Buffer,
  imageType: String
});

const upload = multer({ storage: multer.memoryStorage() });

app.post('/products', upload.single('image'), (req, res) => {
  const { name, price, description, stock } = req.body;
  new Product({
    name, price: Number(price), description, stock: Number(stock),
    image: req.file?.buffer,
    imageType: req.file?.mimetype
  }).save().then(saved => res.json(saved));
});

app.get('/products', (req, res) => {
  const query = req.query.search ? { name: { $regex: req.query.search, $options: 'i' } } : {};
  Product.find(query).then(products =>
    res.json(products.map(p => ({
      _id: p._id, name: p.name, price: p.price,
      description: p.description, stock: p.stock
    })))
  );
});

app.get('/products/:id/image', (req, res) => {
  Product.findById(req.params.id).then(p => {
    if (!p || !p.image) return res.status(404).send('Not found');
    res.set('Content-Type', p.imageType);
    res.send(p.image);
  });
});

app.put('/products/:id', upload.single('image'), (req, res) => {
  const { name, price, description, stock } = req.body;
  const update = { name, price: Number(price), description, stock: Number(stock) };
  if (req.file) { update.image = req.file.buffer; update.imageType = req.file.mimetype; }
  Product.findByIdAndUpdate(req.params.id, update, { new: true })
    .then(p => res.json(p));
});

app.delete('/products/:id', (req, res) => {
  Product.findByIdAndDelete(req.params.id).then(() => res.json({ ok: true }));
});

app.listen(3002, () => console.log('Product service on 3002'));