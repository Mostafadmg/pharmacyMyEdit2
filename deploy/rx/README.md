# PharmaCare Rx — Docker deployment

Runs the **Rx prescriber portal**, **API**, and **PostgreSQL** together.

## Quick start

From the **repository root**:

```bash
docker compose -f deploy/rx/docker-compose.yml up -d --build
```

Initialize the database (schema + demo data) — first time only:

```bash
docker compose -f deploy/rx/docker-compose.yml --profile init run --rm db-init
```

Open:

| Service | URL |
| --- | --- |
| Rx portal | http://localhost:5174 |
| API health | http://localhost:5000/api/healthz |

## Ports

Override in `deploy/rx/.env` (copy from `.env.example`):

- `RX_PORT` — Rx portal (default `5174`)
- `API_PORT` — API (default `5000`)
- `POSTGRES_PORT` — PostgreSQL (default `5432`)

## Stop

```bash
docker compose -f deploy/rx/docker-compose.yml down
```

Remove database volume:

```bash
docker compose -f deploy/rx/docker-compose.yml down -v
```

## Production notes

- Set strong `POSTGRES_PASSWORD` in `.env`.
- Put TLS in front of nginx (Caddy, Traefik, or cloud load balancer).
- Configure email/Stripe via API env vars in `docker-compose.yml` as needed.
