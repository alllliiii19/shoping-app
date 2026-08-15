import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../AuthContext'

const CATEGORIES = ['Persian', 'Kashmiri', 'Turkish', 'Silk', 'Woolen']

export default function Home() {
  const [products, setProducts] = useState([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const { user, logout } = useAuth()

  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('newest')
  const [showSearch, setShowSearch] = useState(false)
  const [showFilter, setShowFilter] = useState(false)
  const [maxPrice, setMaxPrice] = useState('')

  useEffect(() => {
    const params = new URLSearchParams()
    if (category) params.set('category', category.toLowerCase())
    if (search) params.set('search', search)
    if (sort) params.set('sort', sort)
    if (maxPrice) params.set('maxPrice', maxPrice)
    const qs = params.toString() ? `?${params.toString()}` : ''

    setLoading(true)
    api.getProducts(qs)
      .then((data) => {
        setProducts(data.products)
        setCount(data.count)
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [category, search, sort, maxPrice])

  return ( <>
      <header className="header">
        <div style={{ width: 22 }}></div>
        <div className="logo">
          <div className="name">PATRON ARTS</div>
          <div className="sub">CARPETS &amp; HOME</div>
        </div>
        <div className="header-icons">
          {user ? (
            <span style={{ fontSize: 13, cursor: 'pointer' }} onClick={logout}>
              {user.name} · Logout
            </span>
          ) : (
            <Link to="/login" style={{ color: 'inherit' }}><i className="ti ti-user"></i></Link>
          )}
          <i className="ti ti-search" style={{ cursor: 'pointer' }} onClick={() => setShowSearch((s) => !s)}></i>
          <Link to="/cart" style={{ color: 'inherit' }}><i className="ti ti-shopping-bag"></i></Link>
        </div>
      </header>

      {showSearch && (
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search carpets…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>
      )}

      <nav className="nav">
        <span className={category === '' ? 'nav-active' : ''} onClick={() => setCategory('')}>All</span>
        {CATEGORIES.map((c) => (
          <span key={c} className={category === c ? 'nav-active' : ''} onClick={() => setCategory(c)}>{c}</span>
        ))}
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
        <span style={{ cursor: 'pointer' }} onClick={() => setShowFilter((f) => !f)}>Filter</span>
        <span className="count">{count} products</span>
        <select className="sort-select" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">Sort by: Newest</option>
          <option value="price_low">Price: Low to High</option>
          <option value="price_high">Price: High to Low</option>
          <option value="name">Name: A–Z</option>
        </select>
      </div>

      {showFilter && (
        <div className="filter-bar">
          <label>Max price: ₹{maxPrice || 'any'}</label>
          <input
            type="range" min="0" max="400000" step="10000"
            value={maxPrice || 0}
            onChange={(e) => setMaxPrice(e.target.value === '0' ? '' : e.target.value)}
          />
          {maxPrice && <button onClick={() => setMaxPrice('')}>Clear</button>}
        </div>
      )}

      {loading ? (
        <div className="loading">Loading carpets…</div>
      ) : (
        <div className="grid">
          {products.map((p) => (
            <Link to={`/product/${p.id}`} className="card" key={p.id} style={{ color: 'inherit', textDecoration: 'none' }}>
              <div className="img">
                {p.image_url && <img src={p.image_url} alt={p.name} />}
              </div>
              <div className="cat">{categoryName(p.category_id)}</div>
              <div className="title">{p.name}</div>
              <div className="price">₹{Number(p.base_price).toLocaleString('en-IN')}</div>
            </Link>
          ))}
        </div>
      )}

      <section className="story">
        <div className="story-inner">
          <div className="story-label">OUR HERITAGE</div>
          <h2 className="serif">A Kashmiri legacy, woven by hand</h2>
          <p>
            For generations, our family has carried forward the craft of Kashmiri
            carpet weaving from the heart of Srinagar. Every piece at Patron Arts is
            knotted by hand by artisans whose skill has been passed down through the
            decades, using techniques and traditions rooted in the soil of the valley.
            We deal only in authentic, hand-knotted carpets, with no shortcuts and no
            imitations, because we believe a carpet should carry the story and the
            honesty of the hands that made it. When you bring home a Patron Arts carpet,
            you bring home a piece of Kashmir itself.
          </p>
          <div className="story-address">
            <i className="ti ti-map-pin"></i> Dalgate, Srinagar, Kashmir
          </div>
        </div>
      </section>

      <footer className="footer">
        <div style={{ textAlign: 'center' }}>
          <div className="label">OWNER</div>
          <div className="fname">Mohammad Shafi Mir</div>
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