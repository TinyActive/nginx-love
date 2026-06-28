#!/usr/bin/env python3
"""HTTP client using python-requests — should receive 403 when WAF demo rules are active."""
import sys
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

try:
    import requests
except ImportError:
    print("000")
    sys.exit(1)

url = sys.argv[1] if len(sys.argv) > 1 else "https://waf.autogate.cc"
try:
    r = requests.get(url, timeout=15, verify=False)
    print(r.status_code)
except requests.RequestException:
    print("000")
