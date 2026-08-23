# Agents Guide

This document describes how to install and build the project, and outlines the coding principles we follow.

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [pnpm](https://pnpm.io/) (latest version)

## Installation

Clone the repository and install dependencies:

```sh
git clone https://github.com/AxaFrance/slight-capture.git
cd slight-capture
pnpm install
```

## Available Scripts

| Command | Description |
|---|---|
| `pnpm run storybook` | Start Storybook development server on port 6006 |
| `pnpm run build` | Build the Storybook static site |
| `pnpm run build-vite` | Build the library with Vite |
| `pnpm run dev` | Start Vite development server |
| `pnpm run lint` | Run ESLint on source files |
| `pnpm run preview` | Preview the Vite production build |

## Running Locally

To start the Storybook development environment:

```sh
pnpm run storybook
```

Open your browser at [http://localhost:6006](http://localhost:6006). You can test the capture feature on a phone or tablet for the best experience.

## Linting

```sh
pnpm run lint
```

ESLint is configured via `.eslintrc.cjs`. The lint step enforces zero warnings as a hard limit.

## Building

To build the Storybook static site:

```sh
pnpm run build
```

To build only the library with Vite:

```sh
pnpm run build-vite
```

## Coding Principles

### KISS – Keep It Simple, Stupid

- Prefer simple, readable solutions over clever or complex ones.
- Write code that is easy to understand at a glance. If a piece of code needs a long comment to explain what it does, consider rewriting it.
- Avoid over-engineering. Solve the problem at hand, not hypothetical future problems.

### Clean Code

- **Meaningful names**: Variables, functions, and files should have clear, self-explanatory names.
- **Small functions**: Each function should do one thing and do it well.
- **No dead code**: Remove commented-out code and unused variables.
- **Consistent formatting**: Follow the ESLint rules enforced in this project.
- **DRY (Don't Repeat Yourself)**: Extract shared logic into reusable utilities rather than duplicating it.

### Green IT

One of the explicit goals of Slight Capture is to reduce the size and weight of captured images, lowering the energy cost of storing and transferring data. Keep this in mind when contributing:

- Prefer lightweight algorithms over feature-rich but heavy ones.
- Avoid loading large third-party libraries unless they provide clear value.
- Optimize image quality settings to balance visual fidelity and file size.

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) before opening a pull request or issue.
