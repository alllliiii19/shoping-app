import { useState, useEffect } from 'react'
import { api } from './api'

export default function App() {
  const [products, setProducts] = useState([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getProducts()
      .then((data) => {
        setProducts(data.products)
        setCount(data.count)
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <header className="header">
        <div style={{ width: 22 }}></div>
        <div className="logo">
          <div className="name">Patron</div>
          <div className="sub">ARTS &amp; HOME</div>
        </div>
        <div className="header-icons">
          <i className="ti ti-user"></i>
          <i className="ti ti-search"></i>
          <i className="ti ti-shopping-bag"></i>
        </div>
      </header>

      <nav className="nav">
        <span>Persian</span><span>Kashmiri</span><span>Turkish</span>
        <span>Silk</span><span>Woolen</span>
      </nav>

      <section className="hero">
        <div className="crumb">HOME &middot; SHOP &middot; HANDMADE CARPETS</div>
        <h1>Handmade Carpets</h1>
        <p>Welcome to Patron Arts, our collection of exquisite handmade carpets where
        artistry meets craftsmanship. Each piece is unique, knotted by skilled
        artisans, boasting intricate designs and rich colours that bring warmth
        to any space.</p>
      </section>

      <div className="toolbar">
        <span>Filter</span>
        <span className="count">{count} products</span>
        <span>Sort by</span>
      </div>

      {loading ? (
        <div className="loading">Loading carpets…</div>
      ) : (
        <div className="grid">
          {products.map((p) => (
            <div className="card" key={p.id}>
              <div className="img">
                {p.image_url && <img src={p.image_url} alt={p.name} />}
              </div>
              <div className="cat">{categoryName(p.category_id)}</div>
              <div className="title">{p.name}</div>
              <div className="price">₹{Number(p.base_price).toLocaleString('en-IN')}</div>
            </div>
          ))}
        </div>
      )}

      <footer className="footer">
        <div style={{ textAlign: 'center' }}>
          <div className="label">OWNER</div>
          <div className="fname">Sami Meer</div>
        </div>
        <div className="divider"></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div className="avatar"></div>
          <div>
            <div className="label">DEVOPS ENGINEER</div>
            <div className="fname">Hadi Ali</div>
          </div>
        </div>
      </footer>
    </>
  )
}

function categoryName(id) {
  const map = { 1: 'Persian', 2: 'Kashmiri', 3: 'Turkish', 4: 'Silk', 5: 'Woolen' }
  return map[id] || ''
}