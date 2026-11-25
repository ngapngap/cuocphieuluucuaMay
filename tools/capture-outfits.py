from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
import base64
import os
import shutil
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parent.parent
server = ThreadingHTTPServer(('127.0.0.1', 0), partial(SimpleHTTPRequestHandler, directory=str(root)))
Thread(target=server.serve_forever, daemon=True).start()
with sync_playwright() as p:
    chrome = shutil.which('google-chrome') or shutil.which('chromium')
    if not chrome and os.name == 'nt':
        chrome = str(Path(os.environ.get('PROGRAMFILES', r'C:\Program Files')) / 'Google/Chrome/Application/chrome.exe')
    browser = p.chromium.launch(executable_path=chrome, headless=True)
    page = browser.new_page()
    page.goto(f'http://127.0.0.1:{server.server_port}/tools/outfit-preview-stage.html')
    page.wait_for_function('window.ready || window.error', timeout=30000)
    if page.evaluate('window.error'): raise RuntimeError(page.evaluate('window.error'))
    for name in ['vayhong', 'haibim', 'muvang', 'rungxanh', 'tuyetbong', 'cauvong']:
        data = page.evaluate('(name) => captureOutfit(name)', name).split(',')[1]
        (root / 'assets' / 'img' / ('outfit-preview-' + name + '.webp')).write_bytes(base64.b64decode(data))
    browser.close()
server.shutdown()
