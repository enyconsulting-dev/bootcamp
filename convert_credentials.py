import json
import sys
import base64

input_file = sys.argv[1]

with open(input_file, "r", encoding="utf-8") as f:
    data = json.load(f)

# One-line JSON
one_line = json.dumps(data, separators=(",", ":"))

# Base64 version — recommended for Render
base64_value = base64.b64encode(one_line.encode("utf-8")).decode("utf-8")

print("\n=== ONE-LINE JSON ===\n")
print(one_line)

print("\n=== BASE64 ===\n")
print(base64_value)