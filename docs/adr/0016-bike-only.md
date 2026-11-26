# 0016. Wattzup supports the bike only

- **Status:** Accepted
- **Date:** 2026-11-19
- **Supersedes:** [0009](0009-treadmill-as-a-second-machine.md), [0010](0010-treadmill-run-design.md), [0011](0011-treadmill-behind-a-flag.md)

## Context

ADRs 0009 and 0010 added the Echelon Stride treadmill as a second machine beside the bike: a
`machine` field in the state, a machine page (`/machine`) with a list of nearby machines, treadmill
commands for speed, incline and the belt, a Run Setup and a Run Dashboard. ADR 0011 then found that
the only real treadmill available, the rider's Stride-8s, never answered: it accepted every write
and sent no notification at all, and its belt never moved from a Bluetooth command. The treadmill
was put behind `Wattzup:Treadmill:Enabled`, off by default.

With the flag off nobody can use the treadmill, yet it still costs the project: the treadmill code
and its tests run and must be kept green, the mocks, design-system pages, designs and films carry a
treadmill variant of almost every screen, the state contract carries `machine` and
`treadmill_enabled` for every client, and the machine page and its nearby-machines list exist only
to choose between a working machine and one that does not work.

## Decision

**Wattzup supports the Echelon bike only.** Treadmill support and the machine concept are removed:

- The state has no `machine` and no `treadmill_enabled` field, and no treadmill fields (speed and
  incline targets, the belt). There is no `POST /api/machine` and no treadmill endpoint.
- The `Wattzup:Treadmill:Enabled` setting is removed.
- There is no machine page (`/machine`, "What are you training on?") and no nearby-machines list.
  Scanning finds and connects the bike automatically, as it did before the treadmill was added.
- The treadmill requirements (L1-013, L2-062 to L2-075) are marked removed, keeping their IDs; the
  treadmill protocol notes, detailed designs, mocks, design-system components and the treadmill
  film are deleted.

A treadmill, if it is ever supported, would be a separate app with its own requirements, not a
second machine inside Wattzup.

## Consequences

- ADRs 0009, 0010 and 0011 are superseded. They stay as the record of what was tried and why it
  stopped; what ADR 0011 learned about the Stride-8s is kept there.
- The state contract (L2-014), the OpenAPI document and the generated frontend types lose the
  machine and treadmill fields in the same change, which is a breaking change for any client that
  read them; Wattzup's own frontend is the only client.
- Every screen, design and film describes one machine, the bike, so the words "machine", "run",
  "Steady", "target speed", "target incline" and "belt" leave the vocabulary.
- Bringing a treadmill back would start from new requirements; nothing here is kept for it.
