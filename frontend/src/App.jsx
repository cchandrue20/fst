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

  // Edit state
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', price: '', description: '', stock: '' });
  const [editFile, setEditFile] = useState(null);

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

  function startEdit(p) {
    setEditId(p._id);
    setEditForm({ name: p.name, price: p.price, description: p.description, stock: p.stock });
    setEditFile(null);
  }

  function cancelEdit() { setEditId(null); setEditFile(null); }

  function handleUpdateProduct(e, id) {
    e.preventDefault();
    const fd = new FormData();
    fd.append('name', editForm.name);
    fd.append('price', editForm.price);
    fd.append('description', editForm.description);
    fd.append('stock', editForm.stock);
    if (editFile) fd.append('image', editFile);
    axios.put(`${PRODUCT_API}/products/${id}`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(() => { setEditId(null); setEditFile(null); fetchProducts(); });
  }

  function handleDeleteProduct(id) {
    if (!window.confirm('Delete this product?')) return;
    axios.delete(`${PRODUCT_API}/products/${id}`).then(() => fetchProducts());
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
                <td style={{ padding: '10px 12px' }}>&#8377;{item.price}</td>
                <td style={{ padding: '10px 12px' }}>
                  <button onClick={() => changeCartQty(item, -1)}>−</button>
                  <span style={{ margin: '0 10px' }}>{item.quantity}</span>
                  <button onClick={() => changeCartQty(item, 1)}>+</button>
                </td>
                <td style={{ padding: '10px 12px' }}>&#8377;{(item.price * item.quantity).toFixed(2)}</td>
                <td style={{ padding: '10px 12px' }}>
                  <button onClick={() => removeFromCart(item.productId)}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid #eee' }}>
              <td colSpan={4} style={{ padding: '14px 12px', textAlign: 'right', fontWeight: 600 }}>Grand Total:</td>
              <td style={{ padding: '14px 12px', fontWeight: 700, fontSize: '1.05rem' }}>&#8377;{grandTotal.toFixed(2)}</td>
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
            <p>&#8377;{p.price} | Stock: {p.stock}</p>

            {/* Edit / Delete action buttons */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <button
                onClick={() => startEdit(p)}
                style={{ background: '#f0ad4e', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 4, cursor: 'pointer' }}>
                ✏️ Edit
              </button>
              <button
                onClick={() => handleDeleteProduct(p._id)}
                style={{ background: '#d9534f', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 4, cursor: 'pointer' }}>
                🗑️ Delete
              </button>
            </div>

            {/* Inline edit form */}
            {editId === p._id && (
              <form
                onSubmit={e => handleUpdateProduct(e, p._id)}
                style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid #eee', paddingTop: 8 }}>
                <input
                  placeholder="Name"
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  required />
                <input
                  type="number"
                  placeholder="Price"
                  value={editForm.price}
                  onChange={e => setEditForm({ ...editForm, price: e.target.value })}
                  required />
                <input
                  placeholder="Description"
                  value={editForm.description}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
                <input
                  type="number"
                  placeholder="Stock"
                  value={editForm.stock}
                  onChange={e => setEditForm({ ...editForm, stock: e.target.value })}
                  required />
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setEditFile(e.target.files[0])} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="submit"
                    style={{ background: '#5cb85c', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: 4, cursor: 'pointer' }}>
                    💾 Save
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    style={{ padding: '4px 12px', borderRadius: 4, cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {p.stock === 0 ? <p style={{ marginTop: 8 }}>Out of Stock</p> : (
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