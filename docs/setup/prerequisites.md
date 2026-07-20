# Prerequisites

What has to be installed on your machine before working on the project. These are
system tools: cloning the repository does not install them, the same way it does
not install Node.

## Base tools

Install these before anything else:

- **git** - to clone the repository.
- **make** - the entry point for every stack command (`make up`, `make down`).

On most Linux and macOS setups they are already present. If not:

    # Debian / Ubuntu
    sudo apt install git make

    # Fedora (school machines)
    sudo dnf install git make

## Node.js

Managed with [nvm](https://github.com/nvm-sh/nvm) (Node Version Manager). The version is pinned in
`.nvmrc` at the repo root:

    nvm install    # reads .nvmrc
    nvm use

Then install both apps' dependencies:

    npm run install:all

## Container runtime

An OCI (Open Container Initiative)-compatible runtime is required to run the stack. Either works:

- **Docker** with the Compose plugin. Installing it requires root.
- **Podman** with `podman-compose`. Runs rootless - the option on machines where
  you have no sudo.

The Makefile defaults to Docker:

    make up

Podman users override the compose command:

    make COMPOSE="podman-compose" up
    make COMPOSE="podman compose" up     # recent Podman only

## Environment file

`.env` is gitignored and does not exist in a fresh clone. Create it from the
example and fill in real values:

    cp .env.example .env

The Makefile stops with an error if `.env` is missing.

## Notes for WSL (Windows Subsystem for Linux)

Docker on WSL needs a few one-time adjustments.

The daemon does not start on its own unless systemd is enabled:

    sudo service docker start

To avoid prefixing every command with sudo, add yourself to the docker group,
then restart WSL from PowerShell (`wsl --shutdown`) for it to take effect:

    sudo usermod -aG docker $USER

If the daemon fails to start with an iptables error
(`CHAIN_ADD failed`, `addrtype revision 0 not supported`), switch iptables to
legacy mode - the WSL kernel does not ship the nf_tables modules Docker expects:

    sudo update-alternatives --set iptables /usr/sbin/iptables-legacy
    sudo update-alternatives --set ip6tables /usr/sbin/ip6tables-legacy

## Nginx ports on rootless Podman (school machines)

By default the stack exposes Nginx on ports 80 and 443. On rootless setups such
as the school machines, binding to ports below 1024 is forbidden and `make up`
fails with a permission error (`Error 125`, `permission denied`).

Override the host ports in your `.env`:

    HTTP_PORT=8080
    HTTPS_PORT=8443

The stack is then reachable at `https://localhost:8443`. Nginx still listens on
80/443 inside its container - only the host mapping changes.
