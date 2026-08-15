# Patron Arts

A full stack e commerce application for a handmade carpet catalog, built to demonstrate a containerized multi service architecture running behind a reverse proxy on a single host. The application covers product browsing with filtering and search, token based authentication, a cart, and an order flow backed by a real database transaction. Every service runs in its own Docker container and the whole stack is orchestrated with Docker Compose.

## Stack

Backend is Node with Express in a layered structure. PostgreSQL is the primary data store. Redis is wired in as a cache layer. Frontend is React built with Vite. Nginx is the reverse proxy and the single public entry point. Docker and Docker Compose containerize and orchestrate all of it.

## Architecture

The system runs as five containers on one Docker network. Nginx is the only container exposed to the outside world on port 80. Every request enters through Nginx which inspects the path and routes it. Requests to slash api are proxied to the backend container. Everything else is proxied to the frontend container that serves the static React build. The backend reaches PostgreSQL and Redis over the internal network by service name. The frontend and backend are never exposed directly, so the only surface reachable from outside is the proxy.

```
                 Browser
                    |
                  Nginx            port 80, sole public entry, reverse proxy
                 /      \
        path is /api     everything else
             |                 |
          backend           frontend
             |             static React build
     PostgreSQL   Redis
```

Because containers resolve each other by service name on the Compose network, the backend connects to the database at host postgres and to the cache at host redis rather than at an address. The same code that runs against localhost during local development runs against those service names once containerized, and the only thing that changes is the environment configuration injected at run time.

## Request workflow

A page request enters Nginx, is matched against the location blocks, and is proxied to the frontend which returns the built React files. The React app then issues data requests to paths under slash api. Those requests hit Nginx again, match the api location, and are proxied to the backend. The backend runs the request through its middleware and controller layers, queries PostgreSQL, and returns JSON. The React app renders the result. Requests that require an authenticated user carry a token in the authorization header which the backend verifies before the controller runs.

## Backend layers

The backend separates concerns into distinct layers so each file has one job.

Routes map a method and a path to a handler and contain no logic.

Controllers read the request, validate it, decide the status code, and shape the response. They call models but never write queries directly.

Models are the only layer that touches the database. They hold the raw SQL and return plain data.

Middleware runs before controllers on requests that need it. This covers token verification for protected routes, body parsing, and centralized error handling.

Config holds the PostgreSQL connection pool and the Redis client so every other file shares one connection source.

## Data model

The schema separates a product from its purchasable variants. A product is one carpet with a base price and a category. A variant is one size of that carpet with its own price and its own stock count, which is how size selection with per size stock works. Product images are stored as rows that point to image paths, not as binary data. Orders and order items are separate, and an order item records the price at the moment of purchase so historical orders remain accurate even after a product price changes.

## Order transaction

Placing an order is the most involved operation because several tables change together and a partial change would corrupt state. The checkout runs inside a single database transaction. It reads the cart while locking the affected variant rows, verifies stock for every item, computes the totals, writes the order, writes the order items with the frozen purchase price, decrements the stock, and clears the cart. If any step fails the whole transaction rolls back and nothing is written. Row locking during the read prevents two simultaneous checkouts from overselling the same stock.

## Containers and images

Two images are built from source in this repository. The backend image is a straightforward Node image that installs dependencies and runs the server. The frontend image is a multi stage build where the first stage compiles the React application into static assets and the second stage copies only those assets into a minimal serving image, so the final artifact carries no build tooling or source.

Three images are pulled rather than built because they are standard software. Nginx uses the official image with a mounted configuration file. PostgreSQL uses the official image with the schema mounted into its init directory so tables are created on first boot with an empty volume. Redis uses the official image.

Application data lives in a named Docker volume, not in any image, so the database survives container recreation. Configuration such as the schema and the Nginx routing rules is mounted at run time rather than baked into images, which keeps the images generic and portable.

## Configuration and secrets

The backend is configured entirely through environment variables covering the database connection, the cache connection, and the token signing secret. These are supplied by Docker Compose at run time. Secret values are never committed to the repository and never copied into an image, which is why the same image can run in any environment by supplying different configuration.

## Running locally

The host needs Docker and Docker Compose.

Bring the full stack up from the project root.

```
docker compose up -d
```

Verify all five services are healthy.

```
docker compose ps
```

Seed the catalog. This inserts categories, products, their variants, and their image references.

```
cd backend
node src/seed.js
```

The application is then served on the host on port 80 through Nginx.

## Exposing the host

The running stack is published to the internet with a Cloudflare Tunnel that points at the local Nginx on port 80. The tunnel is an outbound connection from the host to the Cloudflare edge, so no inbound port is opened on the network and the host address stays private. TLS is terminated at the edge, so the public endpoint is served over https while the internal traffic between the tunnel and Nginx stays plain http.

```
cloudflared tunnel --url http://localhost:80
```

## Image handling

Product images are served as static files from the frontend build under public images. The database stores only the path to each image. When a page renders, the browser requests each image from the frontend and it is returned as a normal static asset, so no image data ever passes through the database or the API.