# Contributing to the MDD Web Development

## Steps to contribute

If you are contributing as a part of the MDD Web Development team, you can clone the repository and make changes in your own branch.

To clone the repository, use the following command:

```bash
git clone [repo]
```

For other contributors, you can fork the repository and clone it to your local machine.

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

### Make changes

First, create a new branch to make changes.

```bash
git checkout -b [branch-name]
```

You can make changes to the website by editing the files in the `src` directory. The website is built using [Astro](https://astro.build/) and [Tailwind CSS](https://tailwindcss.com/). Check out the documentation for these technologies to learn more about how to make changes.

### Create a pull request

After you have made changes, you can create a pull request to merge your changes into the main branch. You can do this by pushing your branch to the repository and creating a pull request on GitHub.

```bash
git push origin [branch-name]
```

Then, go to the GitHub repository and create a pull request. Make sure to include a description of the changes you made and any relevant information for the reviewers.

### Review and merge

After you have created a pull request, the MDD Web Development team will review your changes. If everything looks good, your changes will be merged into the main branch.
