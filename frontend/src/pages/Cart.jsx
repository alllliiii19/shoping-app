import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../AuthContext'

export default function Cart() {
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [placed, setPlaced] = useState(false)
  const [error, setError] = useState('')
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    api.getCart()
      .then(setCart)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [user, navigate])

  async function remove(id) {
    await api.removeCartItem(id)
    const updated = await api.getCart()
    setCart(updated)
  }

  async function placeOrder() {
    setError('')
    try {
      await api.checkout()
      setPlaced(true)
      setCart({ items: [], total: 0 })
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return <div className="loading">Loading cart…</div>

  return (
    <div className="cart-page">
      <header className="header">
        <Link to="/" style={{ color: 'inherit', fontSize: 13 }}>← Back to shop</Link>
        <div className="logo"><div className="name">PATRON ARTS</div></div>
        <div style={{ width: 80 }}></div>
      </header>

      <div className="cart-inner">
        <h1 className="serif">Your cart</h1>

        {placed ? (
          <div className="order-success">
            <div className="order-check">✓</div>
            <h2 className="serif">Order placed!</h2>
            <p>Thank you for shopping with Patron Arts. Your handwoven carpet is on its way.</p>
            <Link to="/" className="order-continue">Continue shopping</Link>
          </div>
        ) : !cart || cart.items.length === 0 ? (
          <p className="cart-empty">Your cart is empty.</p>
        ) : (
          <>
            {cart.items.map((item) => (
              <div className="cart-row" key={item.cart_item_id}>
                <div>
                  <div className="cart-name">{item.product_name}</div>
                  <div className="cart-meta">{item.size} · {item.color} · Qty {item.quantity}</div>
                </div>
                <div className="cart-right">
                  <span>₹{(Number(item.price) * item.quantity).toLocaleString('en-IN')}</span>
                  <button onClick={() => remove(item.cart_item_id)}>Remove</button>
                </div>
              </div>
            ))}
            <div className="cart-total">
              <span>Total</span>
              <span>₹{Number(cart.total).toLocaleString('en-IN')}</span>
            </div>
            {error && <div className="auth-error">{error}</div>}
            <button className="place-order-btn" onClick={placeOrder}>Place order</button>
          </>
        )}
      </div>
    </div>
  )
}