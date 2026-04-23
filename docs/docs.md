## Math Solver API Documentation

This document describes all backend API endpoints implemented in `backend/app.py`, with behavior derived from `backend/solver.py`.

## Overview

- Base URL: `http://localhost:5000`
- API root: `/api`
- Content type: `application/json` for all POST endpoints
- Session model: cookie-based (`Flask session`)
- CORS: enabled with credentials (`supports_credentials=True`)

The backend stores solver state in the browser session cookie as `solver_data`. The API is stateful: most endpoints depend on previous steps in the same session.

## High-Level Flow

Typical flow for a client:

1. `POST /api/set_formula`
2. `POST /api/solve_for_target`
3. If multiple solutions: `POST /api/choose_solution`
4. If non-constant expression: `POST /api/pass_sweeper`
5. If multi-variable expression: `POST /api/verify_fixed`
6. `POST /api/perform_sweep` (returns PNG image)

## Global Request Rules

All POST endpoints use decorators that enforce request validity:

- `require_json`: request must be JSON (`Content-Type: application/json`), else `415`
- `require_body`: body must exist, else `400`
- `require_fields`: required keys must be present, else `400`
- `require_not_null`: required keys cannot be `null`, else `400`
- `require_types`: required key types are validated, else `400`

Common validation error shape:

```json
{
	"status": "error",
	"status_bool": false,
	"error": "<message>"
}
```

## Session Requirements

All endpoints except `/api` and `/api/set_formula` require an existing solver session.

If session is missing or invalid, API returns `400` with an error similar to:

```json
{
	"status": "error",
	"status_bool": false,
	"error": "No solver session found. Call /api/set_formula first."
}
```

## Formula Syntax Rules

`FormulaSolver.set_formula()` enforces:

- Formula must contain exactly one `=`
- Must contain at least one variable
- No implied multiplication:
	- `3a` is invalid; use `3*a`
	- `3(a+b)` is invalid; use `3*(a+b)`
	- `x(y+1)` is invalid unless `x` is a reserved function
- Supported reserved function names include: `sin`, `cos`, `tan`, `sqrt`, `log`, `exp`, `abs`, `pi`, `E`, `I`, and related inverse/hyperbolic forms

## Endpoint Reference

### `GET /api`

Health/info endpoint.

Response `200`:

```json
{
	"status": "api is running",
	"Available Endpoints": [
		"/api/set_formula",
		"/api/solve_for_target",
		"/api/choose_solution",
		"/api/pass_sweeper",
		"/api/verify_fixed",
		"/api/perform_sweep"
	]
}
```

### `POST /api/set_formula`

Creates a new solver state in session.

Request body:

```json
{
	"formula_string": "S = v * t"
}
```

Validation:

- `formula_string` required
- type must be `string`

Success `200`:

```json
{
	"valid": true,
	"status_bool": true,
	"variables": ["S", "t", "v"],
	"error": "",
	"formula_string": "S = v * t"
}
```

Failure `400` (syntax/input error):

```json
{
	"valid": false,
	"status_bool": false,
	"variables": [],
	"error": "the string provided is inappropriate: it does not contain one '='",
	"formula_string": "S v t"
}
```

Possible statuses:

- `200` success
- `400` validation/parsing issues
- `415` non-JSON content type
- `500` unexpected server error

### `POST /api/solve_for_target`

Solves the stored equation for a specific variable.

Request body:

```json
{
	"target": "S"
}
```

Validation:

- `target` required
- type must be `string`

Success `200` with one solution:

```json
{
	"status": "success",
	"status_bool": true,
	"solutions": ["t*v"],
	"needs_choice": false,
	"error": "",
	"target": "S",
	"available": ["S", "t", "v"],
	"required_list_str": ["t", "v"],
	"formula_string": "S = v * t",
	"is_const": false,
	"is_one_var": false,
	"is_multi_var": true,
	"equation_type": "multi_variable",
	"index": 0,
	"sweeper": null,
	"fixed": {}
}
```

Success `200` with multiple solutions:

```json
{
	"status": "multiple",
	"status_bool": true,
	"solutions": ["-sqrt(x)", "sqrt(x)"],
	"needs_choice": true,
	"error": "",
	"target": "y",
	"available": ["x", "y"],
	"required_list_str": [],
	"formula_string": "y**2 = x",
	"is_const": false,
	"is_one_var": false,
	"is_multi_var": false,
	"equation_type": "",
	"index": 0,
	"sweeper": null,
	"fixed": {}
}
```

Failure `400` examples:

- target not in formula variables
- no session (set formula first)
- solve operation failure

Possible statuses:

- `200` success
- `400` business/validation/session error
- `415` non-JSON content type
- `500` unexpected server error

### `POST /api/choose_solution`

Selects one expression from a previously returned multi-solution list.

Request body:

```json
{
	"index": 1
}
```

Validation:

- `index` required
- type must be `int`
- value must be within `0..len(solutions)-1`

Success `200`:

```json
{
	"status": "success",
	"status_bool": true,
	"solution": "sqrt(x)",
	"error": "",
	"index": 1,
	"required_list_str": ["x"],
	"formula_string": "y**2 = x",
	"is_const": false,
	"is_one_var": true,
	"is_multi_var": false,
	"equation_type": "one_variable",
	"target": "y",
	"solutions": ["-sqrt(x)", "sqrt(x)"],
	"needs_choice": false
}
```

Failure `400` examples:

- no multi-solution context exists
- index out of bounds
- session missing

Possible statuses:

- `200` success
- `400` business/validation/session error
- `415` non-JSON content type
- `500` unexpected server error

### `POST /api/pass_sweeper`

Defines which required variable is swept across a range during plotting.

Request body:

```json
{
	"sweeper": "t"
}
```

Validation:

- `sweeper` required
- type must be `string`
- must be one of `required_list_str` of solved expression

Success `200` for one-variable expression:

```json
{
	"status": "success",
	"status_bool": true,
	"is_const": false,
	"is_one_var": true,
	"is_multi_var": false,
	"equation_type": "one_variable",
	"index": 0,
	"solution": "...",
	"solutions": ["..."],
	"needs_choice": false,
	"target": "...",
	"required_list_final_str": [],
	"required_list_str": ["t"],
	"sweeper": "t",
	"error": ""
}
```

Success `200` for multi-variable expression:

```json
{
	"status": "success",
	"status_bool": true,
	"is_const": false,
	"is_one_var": false,
	"is_multi_var": true,
	"equation_type": "multi_variable",
	"required_list_str": ["a", "b", "t"],
	"required_list_final_str": ["a", "b"],
	"sweeper": "t",
	"error": ""
}
```

Failure `400` examples:

- equation is constant (cannot set sweeper)
- sweeper not in required variables
- session missing

Possible statuses:

- `200` success
- `400` business/validation/session error
- `415` non-JSON content type
- `500` unexpected server error

### `POST /api/verify_fixed`

For multi-variable equations, validates and stores fixed values for non-sweeper variables.

Request body:

```json
{
	"fixed": {
		"a": 10,
		"b": 5
	}
}
```

Validation:

- `fixed` required
- type must be `object` (JSON dict)
- must include all and only keys from `required_list_final_str`

Success `200`:

```json
{
	"status": "success",
	"status_bool": true,
	"is_const": false,
	"is_one_var": false,
	"is_multi_var": true,
	"equation_type": "multi_variable",
	"index": 0,
	"solution": "...",
	"solutions": ["..."],
	"needs_choice": false,
	"target": "...",
	"required_list_final_str": ["a", "b"],
	"required_list_str": ["a", "b", "t"],
	"sweeper": "t",
	"is_fixed_correct": true,
	"fixed": {
		"a": 10,
		"b": 5
	},
	"error": ""
}
```

Failure `400` examples:

- missing required fixed keys
- extra invalid keys
- session missing

Possible statuses:

- `200` success
- `400` business/validation/session error
- `415` non-JSON content type
- `500` unexpected server error

### `POST /api/perform_sweep`

Executes numeric sweep and returns a PNG plot image.

Request body:

```json
{
	"start": 0,
	"end": 100,
	"steps": 50
}
```

Validation:

- `start`, `end`, `steps` required
- each must be numeric (`int` or `float`)
- `steps >= 2`
- `start < end`
- solved expression must already be available

Success `200`:

- Content-Type: `image/png`
- Binary response body (plot image)
- Filename (content-disposition): `<target>_vs_<sweeper>.png`

Failure `400` JSON examples:

```json
{
	"status": "error",
	"status_bool": false,
	"error": "steps must be at least 2"
}
```

```json
{
	"status": "error",
	"status_bool": false,
	"error": "No solution set. Complete previous steps first (set_formula, solve_for_target, etc.)"
}
```

Possible statuses:

- `200` image generated
- `400` validation/business/session error
- `415` non-JSON content type
- `500` unexpected server error

## Expression Classification Fields

Several endpoints return these fields:

- `is_const`: expression has no free variables
- `is_one_var`: expression depends on one variable
- `is_multi_var`: expression depends on two or more variables
- `equation_type`: one of `constant`, `one_variable`, `multi_variable`, or empty string when unresolved

## Important Client Notes

1. Send `credentials: "include"` from frontend requests so the same session cookie is used.
2. Keep endpoint order; skipping steps leads to business errors.
3. Handle both JSON and image responses on `/api/perform_sweep`:
	 - success -> parse as blob/image
	 - failure -> parse as JSON
4. `steps` can be sent numeric; server casts to `int`.

## Example End-to-End (Multi-Variable)

1. Set formula:

```http
POST /api/set_formula
Content-Type: application/json

{"formula_string":"S = v*t + a"}
```

2. Solve target:

```http
POST /api/solve_for_target
Content-Type: application/json

{"target":"S"}
```

3. Choose sweeper:

```http
POST /api/pass_sweeper
Content-Type: application/json

{"sweeper":"t"}
```

4. Fix remaining variables:

```http
POST /api/verify_fixed
Content-Type: application/json

{"fixed":{"v":10,"a":2}}
```

5. Generate plot:

```http
POST /api/perform_sweep
Content-Type: application/json

{"start":0,"end":100,"steps":200}
```

## Debug Mode Note

When Flask runs with `app.debug == True`, selected responses include:

```json
{
	"debug_session": "cookie"
}
```

This field is for debugging and should not be relied on in production clients.
