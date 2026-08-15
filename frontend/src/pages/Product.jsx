import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../AuthContext'

export default function Product() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [message, setMessage] = useState('')
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    api.getProduct(id)
      .then((data) => {
        setProduct(data.product)
        if (data.product.variants.length) setSelected(data.product.variants[0].id)
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [id])

  async function addToCart() {
    if (!user) {
      navigate('/login')
      return
    }
    try {
      await api.addToCart(selected, 1)
      setMessage('Added to cart')
      setTimeout(() => setMessage(''), 2000)
    } catch (err) {
      setMessage(err.message)
    }
  }

  if (loading) return <div className="loading">Loading…</div>
  if (!product) return <div className="loading">Product not found.</div>

  const image = product.images[0]?.url

  return (
    <div>
      <header className="header">
        <Link to="/" style={{ color: 'inherit', fontSize: 13 }}>← Back</Link>
        <div className="logo"><div className="name">Patron Arts</div></div>
        <div className="header-icons">
          <Link to="/cart" style={{ color: 'inherit' }}><i className="ti ti-shopping-bag"></i></Link>
        </div>
      </header>

      <div className="product-page">
        <div className="product-image">
          {image && <img src={image} alt={product.name} />}
        </div>
        <div className="product-info">
          <div className="product-cat">{categoryName(product.category_id)}</div>
          <h1 className="serif">{product.name}</h1>
          <p className="product-desc">{product.description}</p>

          <div className="size-label">Select size</div>
          <div className="size-options">
            {product.variants.map((v) => (
              <button
                key={v.id}
                className={`size-btn ${selected === v.id ? 'active' : ''}`}
                onClick={() => setSelected(v.id)}
              >
                <span>{v.size}</span>
                <span className="size-price">₹{Number(v.price).toLocaleString('en-IN')}</span>
                <span className="size-stock">{v.stock_qty > 0 ? `${v.stock_qty} in stock` : 'Out of stock'}</span>
              </button>
            ))}
          </div>

          <button className="add-btn" onClick={addToCart}>Add to cart</button>
          {message && <div className="add-message">{message}</div>}
        </div>
      </div>
    </div>
  )
}

function categoryName(id) {
  const map = { 1: 'Persian', 2: 'Kashmiri', 3: 'Turkish', 4: 'Silk', 5: 'Woolen' }
  return map[id] || ''
}