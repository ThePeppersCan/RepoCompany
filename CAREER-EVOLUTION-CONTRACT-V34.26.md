# Dragonbound V34.26 — Career Evolution Race Contract

This contract is the reusable boundary between Career Mode's persistent save-specific sporting model and current/future race simulators.

## Race launch payload
Career story race launches now include a `careerEvolution` object containing:

- `raceNumber`
- `phase` / `phaseLabel`
- `playerStyle`
- `performanceWindow` — expected band, upside/downside and pace target; never a hard placement clamp
- `playerModel.racecraft`
- `playerModel.reputation`
- `opponents` — personality/pace/defending/overtaking/stamina profiles for all six established racers
- `battleRules`
- `stamina`
- `teamOrders`
- `rivalries`
- `qualifying`
- `worldReaction`

## Request latest config
Parent → Career iframe:

`dragonbound-career-evolution-config-request`

Career → parent:

`dragonbound-career-evolution-config`

The response includes the same race configuration plus `careerSaveId`.

## Resolve a live battle
Parent → Career iframe:

`dragonbound-career-evolution-battle-request`

Use `mode: "attack"` or `mode: "defend"`, an opponent id, a choice id, and context such as current gap, stamina and sector type.

Attack choices:
- `attack-inside`
- `pressure-exit`
- `use-slipstream`
- `stay-patient`

Defence choices:
- `cover-inside`
- `control-exit`
- `break-tow`
- `dont-over-defend`

Career → parent:

`dragonbound-career-evolution-battle-result`

The returned battle is not cosmetic. It includes outcome probability, actual `positionDelta`, time impact, stamina impact, follow-up bonus where relevant, narrative and a race event for history/rivalry tracking.

## Team orders
Parent → Career iframe:

`dragonbound-career-evolution-team-order`

Store an order with type/event/race number/response/consequence. The Career save persists it and updates Tyrese competition data when an order is ignored or obeyed.

## Result ingestion
Race result payloads can additionally provide:

- `rivalRanks`
- `fastestLap`
- `events`
- `notableMoment`
- normal rank/start/overtake/position-gain/lead-change data

Career Evolution consumes those fields idempotently and writes them into the active save only.

## Fairness rule
Do not use this contract to rubber-band the player to a scripted finishing place. The performance window adjusts baseline competitiveness. Live result still emerges from pace, gap, decisions, stamina, errors, opponent personality and race state.
