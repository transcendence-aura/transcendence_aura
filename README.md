# AURA
> Premium D2C Commerce Platform — ft_transcendence

---

## Description

AURA is a premium Direct-to-Consumer (D2C) platform built as part of the
ft_transcendence project. It combines a modern e-commerce experience with
real-time features, AI-powered recommendations, and a secure user management
system.

The platform allows users to browse curated product collections, manage a
personal wishlist, interact with a live Concierge chat, and receive
personalized product suggestions — all within a fast, server-rendered
interface.

---

## Tech Stack

### Frontend
| Technology       | Purpose                                      |
|------------------|----------------------------------------------|
| Next.js 14+      | React framework with App Router and SSR      |
| TypeScript       | Type safety across the entire frontend       |
| Tailwind CSS     | Utility-first styling                        |
| Zustand          | Lightweight global state management          |
| React Query      | Server state, caching, and data fetching     |
| Socket.io Client | Real-time WebSocket communication            |
| Three.js         | 3D product rendering                         |
| Zod              | Frontend form and schema validation          |

### Backend
| Technology       | Purpose                                      |
|------------------|----------------------------------------------|
| NestJS           | Modular Node.js framework                    |
| TypeScript       | Type safety across the entire backend        |
| Prisma           | Type-safe ORM for PostgreSQL                 |
| PostgreSQL       | Relational database (ACID transactions)      |
| Redis            | Caching and session management               |
| Socket.io        | WebSocket server for real-time features      |
| Passport.js      | OAuth 2.0 authentication strategy            |
| class-validator  | Backend DTO validation                       |
| Helmet.js        | HTTP security headers                        |

### Infrastructure
| Technology       | Purpose                                      |
|------------------|----------------------------------------------|
| Docker           | Containerization — single command launch     |
| Docker Compose   | Multi-service orchestration                  |
| Podman           | Rootless container runtime (school fallback) |
| Nginx            | Reverse proxy and HTTPS termination          |
| Prometheus       | Metrics collection                           |
| Grafana          | Metrics visualization and dashboards         |
| GitHub Actions   | CI/CD — lint, typecheck, build on every PR   |

### Developer Tooling
| Technology       | Purpose                                      |
|------------------|----------------------------------------------|
| ESLint           | Static analysis and error detection          |
| Prettier         | Automatic code formatting                    |
| Husky            | Git hooks enforcement                        |
| Commitlint       | Commit message validation                    |

---

## Prerequisites

Before running the project, make sure you have the following installed:

**Container runtime — one of:**
- [Docker](https://docs.docker.com/get-docker/) 24+ with
  [Docker Compose](https://docs.docker.com/compose/) v2+
- [Podman](https://podman.io/) 4+ with
  [Podman Compose](https://github.com/containers/podman-compose)
  *(rootless fallback for school machines)*

**For local development without containers:**
- [Node.js](https://nodejs.org/) 20+
- [npm](https://www.npmjs.com/) 10+ *(no yarn, no pnpm)*

**Always required:**
- [Git](https://git-scm.com/)

> The project targets OCI-compatible runtimes.
> Docker is the primary runtime. Podman is the supported fallback.
> All Compose files are written to be compatible with both.

---

## Installation

*(To be completed in Phase 1 once Docker Compose is configured.)*

---

## Running the project

### With Docker
```bash
make up
# or
docker compose up --build
```

### With Podman *(school machines)*
```bash
make up-podman
# or
podman-compose up --build
```

### Stop the project
```bash
make down
```

*(Full instructions to be completed in Phase 1.)*

---

## Environment variables

Copy `.env.example` and fill in the required values:

```bash
cp .env.example .env
```

Never commit `.env`. All secrets must stay local.

*(Variables to be documented in Phase 1.)*

---

## Team

*(To be completed — roles, responsibilities, and contributions per member.)*

---

## Project Management

- **Tickets & Sprints:** [Linear](https://linear.app/transcendence-aura)
- **Documentation:** Notion
- **Design:** Figma
- **Communication:** Discord
- **Versioning:** GitHub — branch `dev` for integration, `main` for stable releases
- **CI/CD:** GitHub Actions — lint, typecheck, Docker build on every PR
- **Workflow:** Conventional Commits + Husky + Commitlint

---

## Database Schema

*(To be completed in Phase 2 — diagram and table descriptions.)*

---

## Features

*(To be completed in Phase 12.)*

---

## Modules

*(To be completed in Phase 12 — list, points, and justification per module.)*

---

## Individual Contributions

*(To be completed in Phase 12 — detailed breakdown per team member.)*

---

## Resources

*(To be completed — official docs, articles, and references used.)*

---

## AI Usage

*(To be completed — description of how AI tools were used during development.)*
