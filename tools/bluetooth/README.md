# Bluetooth troubleshooting

`scan_bike.py` lists what the computer's Bluetooth radio sees for 12 seconds, with each device's advertised name and
services, and says whether Telo Ride 1's chooser filters would match it. Use it when the bike does not show up in the
browser's chooser: it shows what the bike actually advertises, which is what the filters in
`frontend/projects/domain/src/bluetooth/web-bluetooth-bike-connection.ts` have to match.

```
pip install bleak
python tools/bluetooth/scan_bike.py
```

Turn the bike on and wake it (pedal) first, and close anything else connected to it (a phone app holds the link, and
the bike then stops advertising). The script only reads advertisements; it never connects or writes.

What it showed for an Echelon EX-3 (name `ECHEX-3-141844`): it advertises service `0bf669f0-45f2-11e7-9598-0800200c9a66`,
not the control service `0bf669f1-…` the app filtered on, so the chooser never listed it. The chooser now also
filters on the name prefix `ECH`.
