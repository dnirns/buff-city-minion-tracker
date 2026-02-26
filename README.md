# Buff This – Minion Tracker

A companion web application for generating and managing NPC "minion" enemies during games of **Buff This – Blok Warz**, a tabletop miniatures game created by [Macharian Rising](https://protagonist-games.itch.io/blokwarz).

The app is deployed on Vercel here:

https://blok-warz-minion-tracker.vercel.app/

This tool automates the dice-driven spawning logic for Goons, Henchmen, Lieutenants, and the Unique Citizen, letting you focus on playing the game rather than juggling rulebook tables and tracking stats on paper.

> **Note:** This is an unofficial fan-made tool. Buff This – Blok Warz is designed and published by Macharian Rising / Protagonist Games.

## What It Does

When a Buff Token is activated during a game, the app rolls virtual dice against the official spawn tables to determine the enemy type (based on the current turn), board edge deployment, and combat intent. Each spawned enemy is rendered as an interactive card displaying its S.C.A.R.E.D. stats (Strike, Condition, Agility, Range, Energy, Damage) along with a Ready tracker. Stats can be adjusted on the fly as the game progresses, and defeated enemies can be removed from the active board.

The app also handles the more complex spawning edge cases from the rulebook, including the Unique Citizen trigger (which spawns on the first Buff Token activation after any Lieutenant has appeared), Commanding Orders intent chains, and Turn 10's "no spawn" rule.

## Technical Overview

The project is built with **Next.js 16** (App Router) using **React 19** and **TypeScript**. There is no backend or database; all game state is persisted to the browser's `localStorage`, making it entirely client-side. Styling is handled through **CSS Modules** scoped to individual components.

The core game logic lives in `src/lib/` and is separated into small, testable modules:

- **`dice.ts`** – D4, D6, and D12 roll utilities.
- **`spawnTable.ts`** – The turn-based spawn matrix lookup.
- **`intentTable.ts`** – Intent determination per enemy type.
- **`spawner.ts`** – Orchestrates the full spawn flow, including Commanding Orders and Unique Citizen logic.
- **`gameState.ts`** – Handles saving and loading game sessions from `localStorage`.

The UI is composed of React components in `src/components/`, each with its own CSS Module for styling. The main game page (`src/app/game/[slug]/page.tsx`) uses a `useReducer` pattern to manage game state, supporting actions such as spawning enemies, adjusting stats, advancing turns, and defeating minions.

### Testing

Unit tests are written with **Vitest** and **React Testing Library**, covering the core spawning logic and component behaviour. End-to-end tests use **Cypress**.

## Getting Started

### Prerequisites

- **Node.js** (v18 or later)
- **npm** (or yarn/pnpm)

### Installation

```bash
git clone <repository-url>
cd buff-this-minion-tracker
npm install
```

### Running the Development Server

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Tests

```bash
# Unit tests
npm test

# Unit tests in watch mode
npm run test:watch

# End-to-end tests (headless)
npm run test:e2e

# End-to-end tests (interactive)
npm run test:e2e:open
```

### Production Build

```bash
npm run build
npm start
```

## Licence

This project is released under the MIT licence.
