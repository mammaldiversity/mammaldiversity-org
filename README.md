# mammaldiversity.org

We are migrating the Mammal Diversity Database to a new platform. It includes a redesigned interface and support for synonym data planned for MDD2.

## Track our progress

Check out the [temporary website](https://hhandika.github.io/mammaldiversity-org/).

## Technologies

- [Astro](https://astro.build/)
- [Tailwind CSS](https://tailwindcss.com/)

## Development

### Clone the repository

```bash
git clone [repo]
```

### Install Node.js using a Node Version Manager

Two commonly used node version managers are [NVM](https://github.com/nvm-sh/nvm) and [fnm](https://github.com/Schniz/fnm). We recommend using [FNM](https://github.com/Schniz/fnm) because it is faster and cross-platform by default. You can follow the installation instructions on the [FNM GitHub page](https://github.com/Schniz/fnm).

Briefly, you can install `fnm` and `Node.js` using the following command:

```bash
# installs fnm (Fast Node Manager)
curl -fsSL https://fnm.vercel.app/install | bash

# activate fnm
source ~/.bashrc

# download and install Node.js
fnm use --install-if-missing 22

# verifies the correct Node.js version is in the environment
node -v # should print `v22.11.0`

# verifies the correct npm version is in the environment
npm -v # should print `10.9.0`
```

Follow the instructions on the [Node.js website](https://nodejs.org/en/download/) for other installation methods.

### Enable Corepack and install dependencies

We use [yarn](https://yarnpkg.com/) to manage the website dependencies. Yarn comes with a plugin called [Corepack](https://yarnpkg.com/features/corepack) and is available by default when you install Node.js. First, we need to enable Corepack and install the dependencies.

```bash
corepack enable

cd mammaldiversity-org

yarn install
```

### Start the development server

This command will start the development server. You can view the website by visiting the URL provided in the terminal.

```bash
yarn run dev
```
