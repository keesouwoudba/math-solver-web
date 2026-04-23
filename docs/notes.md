# MathSolver Product Build Notes

## 1) Product Goal

Build a responsive vanilla JS web app with a custom router, reusable components, and services.

Current scope:
1. Equation Solver (`primary branch`)
2. Sweeper as continuation after solve (`stateful continuation only`)

Key principle: user can go from solving to deeper analysis with minimal friction.

Current product decision:
- Do not implement a separate standalone sweeper branch now.
- Use the existing stateful backend flow only.
- Refactor backend services (solve/sweep separation) later.

## 2) Core User Flow (High Level)

1. Landing page offers Solver as the primary entry.
2. Solver flow lets user enter formula, choose target variable, and solve.
3. After solve, user is prompted: "Want to analyze further?" to continue into sweeper steps.
4. Sweeper continuation lets user configure variables/range and generate plot.
5. Plot result page lazy-loads image; download actions stay disabled until image is ready.
6. User can save session snapshots to `localStorage` and load prior sessions from History.

## 3) Detailed Screen Plan

## 3.1 Landing Page (`/`)

Purpose:
- Main entry point.
- Present Solver as the primary action.

Actions:
1. `Equation Solver` -> go to solver formula entry.

Navigation expectations:
- Logo click goes Home.
- Sidebar/top nav exposes Home, Solver, History.

## 3.2 Solver Page 1 - Formula Workspace (`/solver/formula`)

Purpose:
- User enters equation formula.

UI behavior:
- Text input/textarea workspace.
- On-screen keypad with:
  - operators
  - functions
  - constants
  - variables shortcuts
- Input accepted from both:
  - physical keyboard
  - on-screen keypad buttons

Transition:
- Continue/Next/Solve button moves to variable selection page after formula validation.

## 3.3 Solver Page 2 - Select Variable (`/solver/target`)

Purpose:
- Display current formula.
- Display detected variables as selectable options.

UI behavior:
- Variable chips/cards/buttons.
- User selects one target variable.
- Press `Solve` to start solving.

Transition:
- Go to solving/result state page.

## 3.4 Solver Page 3 - Solving + Result (`/solver/result`)

Purpose:
- Show loading while backend solves.
- Show solved output after response.

Required states:
1. Loading state:
	- spinner/skeleton
	- solve actions disabled
2. Success state:
	- show original formula
	- show solved expression
3. Error state:
	- show message and retry/back action

Bottom CTA:
- Prompt: `Want to analyze further?`
- Button routes user to Sweeper with same equation context.

## 3.5 Sweeper Page 1 - Configure Sweep (`/sweeper/config`)

Entry scenario:
1. From Solver result CTA only:
	- formula and solved context are already available in session

Inputs:
- Formula input
- Sweeper variable selection
- Fixed constants (for non-sweeper variables)
- Range fields: `start`, `end`, `steps`

Action:
- `Perform Sweep & Generate`

Transition:
- Navigate to plot page and start plot request.

## 3.6 Sweeper Page 2 - Plot Result (`/sweeper/result`)

Purpose:
- Display generated plot image from backend.

Required async behavior:
1. On enter, lazy-load image from backend.
2. Before image is ready:
	- show loading animation placeholder
	- disable download buttons
3. After image is ready:
	- render plot image
	- enable download actions

Actions:
- Download PNG
- Optional copy/export data action (if implemented)
- Start new session

## 4) History and Session Persistence

Important constraint:
- No database.
- Active backend session remains in Flask session cookie (`solver_data`).
- History persistence is frontend `localStorage` (not backend cookie history).

Reasoning:
- Backend session cookie is `HttpOnly`, so JS cannot read it directly.
- Cookie size is too limited for many full history snapshots.
- `localStorage` is more suitable for client-side history lists.

Required behavior:
1. User can save data via `Save my data` action.
2. New sessions should also be storable and visible in History.
3. History page accessible via sidebar/menu.
4. On History page load, app reads all entries from `localStorage` and renders them.
5. User can load previous sessions from `localStorage` into active UI state.

Important limitation:
- Loaded history can restore equation/config metadata.
- If user wants image again, app must run sweeper again (no server-side stored images).

Storage roles:
- `solver_data` (backend Flask session cookie): current working state for API flow.
- `mathsolver_history_v1` (frontend localStorage key): array of saved history snapshots.

Suggested localStorage entry shape:
- `id`: unique id (timestamp/uuid)
- `type`: `solver` or `solver_sweep`
- `savedAt`: ISO date string
- `title`: short formula label
- `source`: `from_solver`
- `snapshot`: full plain solver object from final state

History lifecycle:
1. At save time, build a full snapshot of the latest solver state.
2. Add metadata (`id`, `savedAt`, `type`, `title`, `source`).
3. Insert entry at the front of local history array.
4. Persist updated array to `localStorage`.
5. On History page load, read `localStorage` and render newest-first.
6. On selecting a history item, hydrate UI fields from snapshot.
7. For plot recovery, rerun sweeper APIs to regenerate image.

Recommended saved session payload fields:
- session id
- timestamp
- formula string
- branch source (`solver` or `sweeper`)
- selected target
- selected solution index (if any)
- sweeper variable
- fixed constants map
- start/end/steps
- last known status flags

## 5) Frontend Architecture (Vanilla JS)

Planned structure (aligned with your existing folders):
- `frontend/services/Router.js` for route changes and page mounting
- `frontend/services/` for API and storage services
- `frontend/components/` for reusable UI pieces
- `frontend/data/` for constants/design tokens/keypad maps

Suggested service responsibilities:
1. `apiService`:
	- wraps backend endpoints
	- always sends `credentials: "include"`
2. `sessionService`:
	- current in-progress session state
3. `historyService`:
	- serialize/deserialize history entries to localStorage
	- expose `getAll`, `add`, `remove`, `clear`, `loadIntoSession` helpers
4. `plotService`:
	- blob/image fetch and download helpers

Suggested component responsibilities:
1. `TopBar`, `Sidebar`, `Footer`
2. `FormulaInput`
3. `MathKeypad`
4. `VariablePicker`
5. `SolveResultCard`
6. `SweeperForm`
7. `PlotViewer`
8. `HistoryList`

## 6) Backend API Mapping to UI Steps

Base API: `http://localhost:5000/api`

Single flow (stateful):
1. `POST /set_formula`
2. `POST /solve_for_target`
3. `POST /choose_solution` (only when multiple solutions)
1. `POST /pass_sweeper`
2. `POST /verify_fixed` (for multi-variable)
3. `POST /perform_sweep` (returns PNG)

Session note:
- Backend is cookie/session-based, so frontend must keep same credentials context.

## 7) UX and Interaction Rules

1. Button-first interactions where possible (variables and choices as clickables).
2. Clear progress states on multi-step flows.
3. Loading feedback for solve and sweep operations.
4. Disabled actions while async operations are pending.
5. Helpful error messages with recovery path (Back, Retry, Edit input).
6. Smooth transition from solver output to sweeper configuration.

## 8) Visual Design Direction (From Provided Figma Examples)

Use these as canonical design tokens and naming direction.

## 8.1 Brand and UI Naming

- Product name: `MathSolver`
- Tone examples: `Clinical Precision`, `Engineered for Precision`, `Computational Confidence`
- Primary label:
	- `Equation Solver`
- Continuation label:
	- `Analyze Further (Sweep)`

## 8.2 Typography

Font families:
- `Inter` (body, labels, keypad)
- `Space Grotesk` (UI headings)
- `Newsreader` (math display/inline math)

## 9) Injected Content Layout Control (Proven Fix)

Use this pattern whenever router-injected pages feel fixed-size or off-center.

Goal:
- injected page fills available route area
- internal content stays centered and readable
- no fake fixed-width feeling on large screens

Applied fix in this project:
1. Make route container a flex mount area:
	- `index.html` main uses `class="flex-1 flex"`
2. Let custom element host expand fully:
	- in component `:host` use:
	  - `display: flex`
	  - `flex: 1 1 auto`
	  - `width: 100%`
	  - `min-height: 100%`
	  - `justify-content: center`
	  - `align-items: center`
3. Keep max width on inner blocks only:
	- apply readable width cap to content sections like:
	  - `.workspace-card { width: min(100%, 64rem); }`
	  - `.keypad { width: min(100%, 64rem); }`

Important rule:
- Do NOT cap `:host` width for routed pages.
- Cap only inner content blocks.

Why this works:
- host occupies available space from the route mount
- inner UI remains centered and readable
- wide screens no longer make page look like a fixed-size element

Token-style font names used in mocks:
- `body-main`
- `label-caps`
- `h1-ui`
- `h2-ui`
- `math-inline`
- `display-math`
- `keypad-label`

## 8.3 Color System

Core palette values from examples:

- `primary`: `#0f2846`
- `primary-container`: `#273e5d`
- `primary-fixed`: `#d4e3ff`
- `primary-fixed-dim`: `#b1c8ee`
- `on-primary`: `#ffffff`
- `on-primary-fixed`: `#001c39`
- `on-primary-fixed-variant`: `#314867`
- `on-primary-container`: `#92a9ce`

- `secondary`: `#006c49`
- `secondary-container`: `#6cf8bb`
- `secondary-fixed`: `#6ffbbe`
- `secondary-fixed-dim`: `#4edea3`
- `on-secondary`: `#ffffff`
- `on-secondary-container`: `#00714d`
- `on-secondary-fixed`: `#002113`
- `on-secondary-fixed-variant`: `#005236`

- `tertiary`: `#002558`
- `tertiary-container`: `#003a82`
- `tertiary-fixed`: `#d8e2ff`
- `tertiary-fixed-dim`: `#adc6ff`
- `on-tertiary`: `#ffffff`
- `on-tertiary-container`: `#7ba7ff`
- `on-tertiary-fixed`: `#001a42`
- `on-tertiary-fixed-variant`: `#004395`

- `background`: `#f7f9fb`
- `surface`: `#f7f9fb`
- `surface-bright`: `#f7f9fb`
- `surface-dim`: `#d8dadc`
- `surface-variant`: `#e0e3e5`
- `surface-container`: `#eceef0`
- `surface-container-low`: `#f2f4f6`
- `surface-container-high`: `#e6e8ea`
- `surface-container-highest`: `#e0e3e5`
- `surface-container-lowest`: `#ffffff`
- `surface-tint`: `#495f80`

- `on-surface`: `#191c1e`
- `on-surface-variant`: `#44474e`
- `on-background`: `#191c1e`

- `outline`: `#74777e`
- `outline-variant`: `#c4c6ce`

- `error`: `#ba1a1a`
- `error-container`: `#ffdad6`
- `on-error`: `#ffffff`
- `on-error-container`: `#93000a`

- `inverse-surface`: `#2d3133`
- `inverse-on-surface`: `#eff1f3`
- `inverse-primary`: `#b1c8ee`

## 8.4 Shape, Spacing, and Density Tokens

Border radius:
- default: `0.125rem`
- lg: `0.25rem`
- xl: `0.5rem`
- full: `0.75rem`

Spacing tokens:
- `xs`: `0.25rem`
- `sm`: `0.5rem`
- `md`: `1rem`
- `lg`: `1.5rem`
- `xl`: `2.5rem`
- `base`: `4px`
- `grid-gutter`: `1rem`
- `container-margin`: `clamp(1rem, 5vw, 2.5rem)`

## 8.5 Repeated Layout Patterns to Keep

1. Top app bar with brand and help/action.
2. Sidebar navigation for desktop views.
3. Centered content canvas with max-width containers.
4. Card-based content sections for each major step.
5. Progress indicator for multi-step solver journey.
6. Sticky or persistent footer with utility links.

## 9) State Model (Suggested)

Single app state shape (conceptual):

- `currentRoute`
- `branch` (`solver`)
- `formula`
- `variables`
- `target`
- `solutions`
- `selectedSolutionIndex`
- `selectedSolution`
- `sweeper`
- `requiredFinal`
- `fixed`
- `range`: `{ start, end, steps }`
- `plot`: `{ loading, ready, blobUrl, error }`
- `history`: list of saved sessions

## 10) Build Priorities

Phase 1 (must-have):
1. Router + Landing + Solver pages + Sweeper continuation pages.
2. Full API integration with loading/error states.
3. Save/load session history locally.
4. Plot lazy-loading with disabled download until ready.

Phase 2 (quality):
1. Better keypad coverage for math symbols.
2. Better validation messaging and step guards.
3. Optional enhancements: copy data, richer plot metadata cards.

## 11) Constraints and Ground Truth

1. Frontend stack is vanilla JS (no framework required).
2. Own router/components/services implementation.
3. No DB persistence for generated images.
4. Must support desktop and mobile responsive behavior.
5. Backend state uses session cookies and endpoint sequence.

## 12) Current Backend Strategy (Explicit)

Honest assessment:
- Current endpoints are narrow and state-dependent.
- Behavior is similar between solve/sweep intents, but state transitions are strict.
- Full service refactor is needed for cleaner domain boundaries.

Decision for now:
1. Keep current backend endpoints and stateful contract unchanged.
2. Build only solver-first UX with sweep continuation.
3. Avoid adding extra endpoint modes or parallel sweeper-only contracts now.
4. Plan backend refactor later: separate solving service and sweeping/plot service.

## 13) Practical Reminder

History reload is for restoring user configuration/data context. Plot assets are not persisted server-side, so any old session needing a new image must call sweep generation again.

## 14) Implementation Sequence (Follow This Order)

Use this as the practical coding order so each step unlocks the next.

1. Foundation setup:
- Create route map in router.
- Define global app state shape.
- Add API base config with `credentials: "include"`.

2. Core services first:
- Implement `apiService` endpoint wrappers.
- Implement `sessionService` for in-memory current state.
- Implement `historyService` for `localStorage` read/write.
- Implement `plotService` for blob URL + download helper.
- Implement `iconService` with one enhancer function that converts `[data-icon]`
	placeholders into rendered icons (Material Symbols now, swappable later).

3. Shared shell components:
- Build `TopBar`, `Sidebar`, `Footer`.
- Add route-aware nav highlighting.
- Add common loading and error UI blocks.
- Standardize icon placeholders in templates as `<span data-icon="..."></span>` and
	call `iconService.enhanceIcons(root)` after each render.

4. Landing page:
- Build Solver primary action.
- Ensure route transitions to solver start page.

5. Solver formula page:
- Build formula workspace input.
- Build keypad component and keyboard integration.
- On submit: call `set_formula`, store response in session state.

6. Solver target page:
- Render formula + variable choices from session state.
- On solve: call `solve_for_target`.
- If `needs_choice=true`, show solution selection step before finalizing.

7. Solver result page:
- Add solve loading, success, and error states.
- Render solved output.
- Add CTA to continue to sweeper continuation steps.
- Add `Save my data` action to write solver snapshot to history.

8. Sweeper config page:
- Support only solver continuation entry mode.
- Build sweeper/fixed/start/end/steps inputs.
- Call `pass_sweeper`, `verify_fixed`, then navigate to result page.

9. Sweeper result page:
- Trigger `perform_sweep` on page enter.
- Show loading placeholder until image resolves.
- Keep download buttons disabled during loading.
- Enable download when blob URL is ready.
- Add `Save my data` action to write sweeper snapshot to history.

10. History page:
- On load: read `mathsolver_history_v1` from `localStorage`.
- Render newest-first entries with metadata.
- Add load/delete/clear actions.
- On load action: hydrate UI/session from snapshot.
- If entry needs image, rerun sweep to regenerate plot.

11. Route guards and resilience:
- Prevent entering pages without required state.
- Redirect gracefully to prior valid step.
- Normalize and show backend error messages.

12. QA pass:
- Test complete happy paths for both branches.
- Test refresh behavior and history recovery.
- Test empty/missing/invalid inputs.
- Test mobile + desktop responsive behavior.
