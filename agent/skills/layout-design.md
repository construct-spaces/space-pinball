---
id: pinball-layout-design
name: Pinball Layout Design
description: Design and edit pinball table layouts in the editor
trigger: layout|table|design|pinball|bumper|flipper|wall
category: space
tools: [space_run_action]
---

# Pinball Layout Design

You can design and edit pinball table layouts by calling actions on the Pinball space via `space_run_action`.

## Coordinate system

- Playfield is `width × height` pixels (default 600×900). Origin top-left, +x right, +y down.
- Standard playfield interior: x ∈ [20, 580], y ∈ [20, 880]. Outer walls take 10 px on each side.
- Ball spawn typically lives in the right-hand plunger lane around (550, 820).
- Snap coordinates to the 10 px grid when possible.

## Element kinds (physics)

| kind | shape | required fields |
|---|---|---|
| `wall` | rect | x, y, w, h, angle |
| `slingshot` | rect | x, y, w=90, h=18, angle ≈ ±0.6 |
| `rollover` | rect (sensor) | x, y, w, h, angle |
| `drain` | rect (sensor) | x, y, w, h, angle |
| `bumper` | circle | x, y, r=24 |
| `peg` | circle | x, y, r=6 |
| `teleport` | circle (sensor) | x, y, r=16 |
| `flipperLeft` / `flipperRight` | special | x, y |
| `arcRail` / `gateRail` | polyline | points, thickness |

## Decoration kinds (visual only — no physics)

- `light` — colored glow. Fields: x, y, r, color (#hex), intensity (0..1).
- `text` — label. Fields: x, y, text, size, color.
- `emitter` — particle burst on trigger. Fields: x, y, count, color, spread (rad), speed.

Decorations support an optional `trigger`:
- `{ type: 'bumper' | 'slingshot' | 'rollover' | 'rolloverBank' | 'ballLost' | 'gameOver' }`
- `{ type: 'hit', sourceId: '<element-id>' }` — fires when a specific element is hit.
Without a trigger, lights pulse idly and text is static.

## Available actions

- `get_layout` — full current layout JSON. Always call this first to see what exists.
- `list_layouts` — saved layouts.
- `load_layout(id)` — switch active layout.
- `new_layout(name?)` — fresh boilerplate (walls + drain + 2 flippers).
- `rename_layout(name)`.
- `add_element(kind, x, y)` — add a physics element with default size for that kind.
- `update_element(id, patch)` — patch any subset of fields on an element.
- `delete_element(id)`.
- `add_decor(kind, x, y)` — add a decoration with default fields.
- `update_decor(id, patch)` — patch any subset, including `trigger`.
- `set_ball_start(x, y)` — move the ball spawn.
- `clear_layout()` — reset to boilerplate.

## Workflow

1. Call `get_layout` first to see the current state.
2. Reason about what to add/move/delete to satisfy the user's request.
3. Call actions in order. Each action applies immediately and is undoable in the editor (Cmd+Z).
4. After significant edits, call `get_layout` again to confirm.

## Style guidance

- Symmetry helps — mirror left/right elements across the playfield center.
- Bumpers usually cluster in the upper third (y ≈ 200–400).
- Pegs are decorative deflectors — place in clusters of 4–6.
- Slingshots sit just above the flippers (y ≈ 700) at angles ±0.6.
- Keep elements clear of the plunger lane (x > 520) unless intentional.
