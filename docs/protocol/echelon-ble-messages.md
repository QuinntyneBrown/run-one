# Echelon BLE messages

Byte-level detail: [echelon-ble-frames.md](./echelon-ble-frames.md).

## To the bike

| Name | Description |
|---|---|
| `A0` Keepalive | Sent once per second to keep the connection alive. |
| `A1` Device info request | Asks the bike for device info; sent at init. |
| `A3` Resistance range request | Asks the bike for its resistance range; sent at init. |
| `B0` Start data stream | Starts the bike's notifications; last init command. |
| `B1` Set resistance | Sets the bike's resistance to the target resistance level. |

## From the bike

| Name | Description |
|---|---|
| `D0` Unknown | Meaning unknown; always payload `01`; ignored. |
| `D1` Workout data | About once per second: elapsed time, revolution count, cadence. |
| `D2` Resistance | The bike's current resistance level. |
