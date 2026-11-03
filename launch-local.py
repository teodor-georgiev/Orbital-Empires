#!/usr/bin/env python3
"""Offline local HTTP launcher for the source ZIP; Python 3 standard library only."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os
import webbrowser

def run():
    os.chdir(Path(__file__).resolve().parent)
    class Handler(SimpleHTTPRequestHandler):
        pass
    with ThreadingHTTPServer(("127.0.0.1", 0), Handler) as server:
        address = f"http://127.0.0.1:{server.server_port}/"
        print("Orbital Empires – local game server", address)
        print("Press Ctrl+C to stop. No external network or account required.")
        webbrowser.open(address)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("Shutting down local server.")

if __name__ == "__main__":
    run()
