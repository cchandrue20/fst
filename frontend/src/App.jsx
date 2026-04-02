import { useState, useEffect } from 'react';
import axios from 'axios';

const PRODUCT_API = 'http://localhost:3002';
const CART_API = 'http://localhost:3003';

export default function App() {
  const [page, setPage] = useState('products');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', price: '', description: '', stock: '' });
  const [file, setFile] = useState(null);
  const [ordered, setOrdered] = useState(false);

  useEffect(() => { fetchProducts(); fetchCart(); }, []);

  function fetchProducts(q = '') {
    axios.get(`${PRODUCT_API}/products?search=${q}`).then(res => setProducts(res.data));
  }

  function fetchCart() {
    axios.get(`${CART_API}/cart`).then(res => setCart(res.data));
  }

  function handleAddProduct(e) {
    e.preventDefault();
    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('price', form.price);
    fd.append('description', form.description);
    fd.append('stock', form.stock);
    if (file) fd.append('image', file);
    axios.post(`${PRODUCT_API}/products`, fd).then(() => {
      setForm({ name: '', price: '', description: '', stock: '' });
      setFile(null);
      fetchProducts();
    });
  }

  function setQty(id, val, max) {
    setQuantities({ ...quantities, [id]: Math.max(1, Math.min(Number(val), max)) });
  }

  function addToCart(p) {
    axios.post(`${CART_API}/cart`, {
      productId: p._id, name: p.name, price: p.price, quantity: quantities[p._id] || 1
    }).then(() => fetchCart());
  }

  function changeCartQty(item, delta) {
    axios.put(`${CART_API}/cart/${item.productId}`, { quantity: item.quantity + delta })
      .then(() => fetchCart());
  }

  function removeFromCart(productId) {
    axios.delete(`${CART_API}/cart/${productId}`).then(() => fetchCart());
  }

  function handlePayNow() {
    setOrdered(true);
    setTimeout(() => { setOrdered(false); setCart([]); setPage('products'); }, 2500);
  }

  const totalQty = cart.reduce((s, i) => s + i.quantity, 0);
  const grandTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  if (page === 'cart') return (
    <div style={{ padding: 24, maxWidth: 860, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1>🛒 Your Cart</h1>
        <button onClick={() => setPage('products')}>← Back to Products</button>
      </div>

      {ordered && (
        <p style={{ background: '#d4edda', color: '#155724', padding: '12px 16px', borderRadius: 8, marginBottom: 16 }}>
          ✅ Order Placed Successfully! Payment Confirmed.
        </p>
      )}

      {cart.length === 0 && !ordered && <p>Your cart is empty.</p>}

      {cart.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
              <th style={{ padding: '8px 12px' }}>Image</th>
              <th style={{ padding: '8px 12px' }}>Name</th>
              <th style={{ padding: '8px 12px' }}>Price</th>
              <th style={{ padding: '8px 12px' }}>Quantity</th>
              <th style={{ padding: '8px 12px' }}>Subtotal</th>
              <th style={{ padding: '8px 12px' }}></th>
            </tr>
          </thead>
          <tbody>
            {cart.map(item => (
              <tr key={item.productId} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '10px 12px' }}>
                  <img src={`${PRODUCT_API}/products/${item.productId}/image`} width="60" height="60" style={{ objectFit: 'cover', borderRadius: 6 }} alt={item.name} />
                </td>
                <td style={{ padding: '10px 12px' }}><strong>{item.name}</strong></td>
                <td style={{ padding: '10px 12px' }}>₹{item.price}</td>
                <td style={{ padding: '10px 12px' }}>
                  <button onClick={() => changeCartQty(item, -1)}>−</button>
                  <span style={{ margin: '0 10px' }}>{item.quantity}</span>
                  <button onClick={() => changeCartQty(item, 1)}>+</button>
                </td>
                <td style={{ padding: '10px 12px' }}>₹{(item.price * item.quantity).toFixed(2)}</td>
                <td style={{ padding: '10px 12px' }}>
                  <button onClick={() => removeFromCart(item.productId)}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid #eee' }}>
              <td colSpan={4} style={{ padding: '14px 12px', textAlign: 'right', fontWeight: 600 }}>Grand Total:</td>
              <td style={{ padding: '14px 12px', fontWeight: 700, fontSize: '1.05rem' }}>₹{grandTotal.toFixed(2)}</td>
              <td style={{ padding: '14px 12px' }}>
                <button onClick={handlePayNow}>💳 Pay Now</button>
              </td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h1>🛍️ Online Shop</h1>
        <button onClick={() => setPage('cart')}>🛒 Cart ({totalQty})</button>
      </div>

      <h2>Add Product</h2>
      <form onSubmit={handleAddProduct}>
        <input name="name" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />{' '}
        <input name="price" type="number" placeholder="Price" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />{' '}
        <input name="description" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />{' '}
        <input name="stock" type="number" placeholder="Stock" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} required />{' '}
        <input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} />{' '}
        <button type="submit">Add Product</button>
      </form>

      <h2>Products</h2>
      <input placeholder="🔍 Search..." value={search} onChange={e => { setSearch(e.target.value); fetchProducts(e.target.value); }} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginTop: 16 }}>
        {products.map(p => (
          <div key={p._id} style={{ border: '1px solid #ddd', padding: 16, borderRadius: 8 }}>
            <img src={`${PRODUCT_API}/products/${p._id}/image`} width="100%" height="150" style={{ objectFit: 'cover' }} alt={p.name} />
            <h3>{p.name}</h3>
            <p>{p.description}</p>
            <p>₹{p.price} | Stock: {p.stock}</p>
            {p.stock === 0 ? <p>Out of Stock</p> : (
              <>
                <button onClick={() => setQty(p._id, (quantities[p._id] || 1) - 1, p.stock)}>−</button>
                <input type="number" min="1" max={p.stock} value={quantities[p._id] || 1}
                  onChange={e => setQty(p._id, e.target.value, p.stock)} style={{ width: 50, textAlign: 'center' }} />
                <button onClick={() => setQty(p._id, (quantities[p._id] || 1) + 1, p.stock)}>+</button>
                <button onClick={() => addToCart(p)}>Add to Cart</button>
              </>
            )}
          </div>
        ))}
      </div>

      {products.length === 0 && <p>No products found.</p>}
    </div>
  );
}