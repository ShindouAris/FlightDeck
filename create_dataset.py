import csv
import json

keep_fields = {
    "id",
    "ident",
    "name",
    "latitude_deg",
    "longitude_deg",
    "iata_code",
    "municipality"
}

result = []

with open("./public/airports.csv", "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)

    for row in reader:
        small = {k: row[k] for k in keep_fields}

        # convert numeric cho gọn memory + đúng kiểu
        small["lat"] = float(small["latitude_deg"])
        small["long"] = float(small["longitude_deg"])
        small["id"] = int(small["id"])

        del small["latitude_deg"]
        del small["longitude_deg"]

        if not small["iata_code"]:
            continue # skip airports without IATA code to reduce size, we don't need them for our use case

        result.append(small)

import re
import json

# with open("./public/airports_small.json", 'r', encoding='utf-8') as f:
#     airports = json.load(f)

def is_valid_icao(ident):
    return bool(re.fullmatch(r"[A-Z]{4}", ident))

filtered = [a for a in result if is_valid_icao(a["ident"])]

with open("./public/airports.json", "w") as f:
    json.dump(filtered, f, indent=4)

# with open("./public/airports_small.json", "w", encoding="utf-8") as f:
#     json.dump(result, f, ensure_ascii=False, indent=4)

print("Done 🔥")