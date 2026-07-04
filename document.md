# Star Wars Force User Builder — Project Document

## Project Overview

Star Wars Force User Builder is a small web app that lets players build a Star Wars-style force user by choosing from randomized character options across five categories. The app combines simple game logic, score tracking, and a leaderboard so players can compare their results.

The website is currently built as a single-page-style experience with separate routed views for Home, Builder, About, and Leaderboard.

---

## What the Website Does

Users can:
- open the Home screen
- start the builder
- choose one category at a time to lock in
- see the remaining categories randomize again after each choice
- view their final build and score
- enter a username and save their result to the leaderboard
- view the saved leaderboard from the navigation menu

---

## Current Website Structure

### Home Screen

The Home screen is the landing page for the app. It includes:
- a title and short description
- a button to start building
- a button to view the leaderboard
- a top navigation bar for quick movement between pages

### Builder Screen

The Builder screen is the main game screen.

It includes:
- five categories to build through
- randomized character options for each category
- a button for each option so the player can lock it in
- automatic re-randomization of the remaining categories after each choice
- a round indicator that shows the current step

### Results Screen

After the fifth category is locked in, the app shows the Results screen.

This screen displays:
- the final selected options
- the total score
- a percentile-style value based on the current score
- an input for the username
- a button to submit the score

### Leaderboard Screen

The Leaderboard screen shows all saved results.

It displays:
- a ranking number
- the username
- the total score
- the percentile value
- the date the score was submitted

### About Screen

The About screen explains:
- what the website is for
- how the builder works
- how the leaderboard works
- how to move around the app

---

## How the Game Works

1. The player opens the app.
2. They click Start Building from the Home screen.
3. The Builder screen shows randomized options for the current categories.
4. The player picks one category and locks it in.
5. The remaining categories are randomized again.
6. The process continues until all five categories are filled.
7. The app shows the final build and total score.
8. The player can submit the result to the leaderboard.

---

## Scoring

Each option in the game has a point value assigned by the developer.

The total score is calculated by adding the points from the five locked-in choices. In the current version, the displayed percentile value is based on the same total score value.

---

## Leaderboard

The leaderboard is stored on the server and loaded by the browser when the Leaderboard screen is opened.

Current behavior:
- scores are saved when the player submits them
- the leaderboard is fetched from the server
- results are shown in ranked order

---

## Technical Stack

### Front End
- HTML
- CSS
- JavaScript

### Back End
- C#
- .NET Minimal API

### Data Storage
- JSON file stored locally in the project

---

## Project Files

- Program.cs — server setup, API routes, and leaderboard storage logic
- public/index.html — main app shell and screen content
- public/style.css — styling for the layout, buttons, cards, and screens
- public/script.js — routing, screen switching, game logic, and leaderboard interaction
- data/scores.json — saved leaderboard entries

---

## Current Features

- Home, Builder, About, and Leaderboard views
- route-based screen switching
- randomized builder options
- category locking and round progression
- results screen with score display
- leaderboard saving and loading
- quick navigation buttons for switching between views

---

## Future Improvements

Possible improvements for later versions include:
- more advanced scoring rules
- stronger Star Wars-themed visuals and animations
- leaderboards with filtering and sorting options
- user profiles or save history
- more detailed character categories and images

---

## Summary

This website is a small interactive Star Wars-themed builder game that combines randomization, player choices, scoring, and a leaderboard. It is built as a lightweight full-stack web app using C#, .NET Minimal API, and JavaScript, with the UI organized into separate routed screens for a smoother experience.
