# Getting started

The ordered path from a fresh machine to a running stack. Follow the steps in
order the first time you set the project up.

A note before you start: the tools in step 1 (git, make, Node, a container
runtime) are system tools you install once, by hand. Everything else the project
uses - ESLint, NestJS, Apollo, and the rest - is a project dependency that
`make setup` installs for you in step 5. You never install those by hand.

## 1. Install the system tools

git, make, Node (via nvm), and a container runtime (Docker or Podman). See
[prerequisites.md](./prerequisites.md) for versions and platform notes,
including the WSL and rootless-Podman specifics.

## 2. Clone the repository

    git clone <repository-url>
    cd transcendence

## 3. Check your machine is ready

    make check-tools

This reports any missing system tool and points you back to the prerequisites.
It installs nothing.

## 4. Create your environment file

    cp .env.example .env

`.env` is gitignored and holds your local values. On rootless Podman (school
machines), also set the host ports here - see step 6.

## 5. Install project dependencies

    make setup

One command installs dependencies for the root, the frontend and the backend.

## 6. Start the stack

    make up

Docker users reach the app at https://localhost. The certificate is
self-signed, so your browser will warn once - continue past it.

Podman users on the school machines run the same `make up` and, having set `HTTP_PORT=8080` / `HTTPS_PORT=8443` in `.env`, reach the app at
https://localhost:8443. (Ports below 1024 are forbidden without root; see
prerequisites.md.)

## Running an app on its own

To run the frontend or backend directly on the host, outside the stack - useful
for fast iteration - see [local-development.md](./local-development.md).

## Next steps

Read [CONTRIBUTING.md](../../CONTRIBUTING.md) for the branching model, commit
format, and pull-request workflow before your first commit.
