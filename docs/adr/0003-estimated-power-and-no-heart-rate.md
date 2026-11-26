# 0003. Estimated power, and no heart-rate sensor

- **Status:** Accepted
- **Date:** 2026-11-15

## Context

The design leads with power and shows average power, heart rate, distance and energy. The Echelon
frames carry cadence, resistance, elapsed time and a revolution count, but no power or heart rate
(`docs/protocol/echelon-ble-frames.md`).

## Decision

Power is estimated in `Wattzup.Core` as `max(0, round(cadence × (0.55 + level × 0.155)))`, the
design's `estimateWatts`, and labelled as an estimate in the UI. The target power uses the segment's
cadence aim. Average power, distance (integrated from speed) and energy
(`avg × t / 1000 / 0.24 / 4.184`) are derived per ride (L2-049). Heart rate stays in the layout and
the contract but is always `null`, shown as `--`, until a requirement adds a sensor.

## Consequences

- No transport reads a heart-rate strap; adding one needs a new requirement and ADR.
- The figures are comparable between rides on the same bike, not with a power meter.
