import urllib.request
import urllib.parse
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = 'https://script.google.com/macros/s/AKfycbxpWtZ4n7rr4F3H5r3ORbvSBaF9SiyJuJukiOmJ6O3m_c57L9vowjHqJjVjKmfoisOuFQ/exec'
payload = {'action': 'get_po_customer'}
data = urllib.parse.urlencode({'payload': json.dumps(payload)}).encode('utf-8')

req = urllib.request.Request(url, data=data, method='POST')
try:
    with urllib.request.urlopen(req, context=ctx) as response:
        print(response.read().decode('utf-8'))
except Exception as e:
    print(e)
