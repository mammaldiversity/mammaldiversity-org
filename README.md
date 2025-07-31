# mammaldiversity.org

This project is a complete rewrite of the [Mammal Diversity Database (MDD)](httpss://www.mammaldiversity.org/) website. The live site is available at [mammaldiversity.org](https://www.mammaldiversity.org/).

Our primary goals for this rewrite are:

- **Improve Performance:** Build a faster, more responsive website using modern web technologies.
- **Modernize the Interface:** Create a clean, intuitive, accessible, and mobile-friendly user interface.
- **Enhance Data Presentation:** Provide a more comprehensive and interactive way to explore the data.
- **Support Dataset Growth:** Accommodate the expanding Mammal Diversity Database, including over 50,000 synonyms introduced in the version 2 release.
- **Maintainability:** Ensure the codebase is easy to maintain and extend. The new modular and scalable architecture allows for easier updates and feature additions, which saves time, effort, and project budget in the long run.

The website is built with [Astro](https://astro.build/), a modern web framework for building fast, content-focused websites. It uses [Tailwind CSS](https://tailwindcss.com/) for styling. The search functionality is powered by [Pagefind](https://pagefind.app/), a static site search library. End-to-end testing is done with [Playwright](https://playwright.dev/).

> **Note:** The original version of the MDD website is available at [classic.mammaldiversity.org](http://classic.mammaldiversity.org/).

## Development

To get started with development, you will need to have Node.js and yarn installed. A detailed guideline for working with MDD codebase is available in the [CONTRIBUTING.md](CONTRIBUTING.md) file.

### Quick Start

#### Install dependencies

```bash
yarn install
```

#### Run the development server

```bash
yarn run dev
```

   This will start the development server at `http://localhost:4321`.

### Testing

The project uses Playwright for end-to-end testing. To run the tests, use the following command:

Install Playwright dependencies if you haven't already:

```bash
yarn playwright install
```

Run the tests:

```bash
yarn test
```

You can view the test report using:

```bash
yarn show-report
```

### Building for Production

To build the site for production, run the following command:

```bash
yarn build
```

### Deployment

Deployment is handled automatically by a GitHub Action whenever changes are pushed to the `main` branch. The action builds the site and deploys it to GitHub Pages.

## Contributing

Please read the [CONTRIBUTING.md](CONTRIBUTING.md) for details on contributing to this project.
