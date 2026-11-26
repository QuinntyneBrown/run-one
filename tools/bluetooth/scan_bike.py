import asyncio
from bleak import BleakScanner

# What the app's chooser filters on (web-bluetooth-bike-connection.ts): the Echelon control service, FTMS, name prefix ECH.
ECHELON = "0bf669f1-45f2-11e7-9598-0800200c9a66"
FTMS = "00001826-0000-1000-8000-00805f9b34fb"

async def main():
    found = await BleakScanner.discover(timeout=12.0, return_adv=True)
    print(f"{len(found)} devices seen\n")
    for address, (device, adv) in sorted(found.items(), key=lambda kv: -(kv[1][1].rssi or -999)):
        uuids = [u.lower() for u in adv.service_uuids]
        name = adv.local_name or device.name or ""
        match = []
        if ECHELON in uuids: match.append("ECHELON-service")
        if FTMS in uuids: match.append("FTMS-service")
        if name.upper().startswith("ECH"): match.append("name-ECH")
        if match or name:
            print(f"{name or '(no name)':28} {address}  rssi={adv.rssi}  services={uuids}  APP-FILTER-MATCH={bool(match)}  {match}")

asyncio.run(main())
