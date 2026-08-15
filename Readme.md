# Patron Arts

Patron Arts is a full stack e commerce website for a Kashmiri handmade carpet business. It lets people browse a catalog of carpets, filter and search through them, view a product with its available sizes and stock, create an account, add carpets to a cart and place an order. The whole application runs in Docker containers on a single virtual machine and is exposed to the internet through a Cloudflare Tunnel.

This project was built from scratch to learn how a real backend, database, frontend and reverse proxy fit together and how to containerize all of them.

## What the application does

A visitor lands on the home page and sees a grid of carpets pulled live from the database. They can filter by category such as Persian, Kashmiri, Turkish, Silk and Woolen, search carpets by name, sort by price or name, and open any carpet to see its full detail page. Each carpet has three sizes and every size has its own price and stock count.

To buy something a visitor registers an account or logs in. Passwords are hashed before they are stored and a token is issued on login which the browser sends on every request that needs a logged in user. A logged in user can add a specific size of a carpet to their cart, change the cart, remove items and place an order. Placing an order runs a real database transaction that checks stock, records the order, freezes the price that was paid, reduces the stock and clears the cart.

## Tech stack

Backend is built with Node and Express in a layered structure of routes, controllers, models, middleware and config. PostgreSQL stores all the data. Redis is set up as a cache layer. The frontend is a React application built with Vite. Nginx sits in front as a reverse proxy and decides where each request goes. Everything is containerized with Docker and orchestrated with Docker Compose.

## Architecture

The browser only ever talks to Nginx. Nginx looks at the address of each request. Anything that starts with slash api is sent to the backend container. Everything else is sent to the frontend container. The backend talks to PostgreSQL for data and to Redis for caching. Only Nginx is exposed to the outside on port 80. The frontend and backend are not reachable directly from outside and are only reached through Nginx on the internal Docker network.

```
Browser
   |
 Nginx        (port 80, the only public entry)
   |  \
   |   \  /api goes to backend
   |    \
 frontend   backend
                |
        PostgreSQL and Redis
```

## Containers

The stack runs five containers.

nginx is the reverse proxy and the public entry point. It uses the official nginx image with a custom config file mounted in.

frontend is the React application. It is built with a multi stage Dockerfile where the first stage compiles the React code into static files and the second stage serves those static files with a small nginx.

backend is the Express API. It is built from its own Dockerfile.

postgres is the database. It uses the official postgres image with the schema file mounted in so the tables are created on first start.

redis is the cache. It uses the official redis image.

## Database

The database holds users, categories, products, product variants, product images, cart items, orders, order items, addresses, wishlist items and reviews. A product is one carpet. A variant is one size of that carpet with its own price and stock. An order item stores the price at the moment of purchase so past orders stay correct even if the carpet price changes later.

## Running the project

The virtual machine needs Docker and Docker Compose installed.

Bring the whole stack up from the project root.

```
docker compose up -d
```

Check that all five containers are running.

```
docker compose ps
```

Load the sample carpet data into the database. This creates the categories, the products, their sizes and their images.

```
cd backend
node src/seed.js
```

The site is then available on the machine on port 80.

## Making it public

The site is exposed to the internet with a Cloudflare Tunnel. A tunnel is started from the virtual machine pointing at the local Nginx on port 80. Cloudflare returns a public https address that anyone can open from any device. Cloudflare handles the https so no certificates need to be managed on the machine.

```
cloudflared tunnel --url http://localhost:80
```

## Images

Product images are stored as files in the frontend under public images. The database only stores the path to each image, not the image itself. When the site is served the browser requests each image from the frontend and it is served as a normal static file.

## Environment variables

The backend reads its database connection, its redis connection and its token secret from environment variables. These are supplied by Docker Compose when the backend runs as a container. Secret values are never committed to the repository and are never baked into any image.

## Credits

Owner Mohammad Shafi Mir
Location Dalgate Srinagar Kashmir

Built and containerized by Hadi Ali