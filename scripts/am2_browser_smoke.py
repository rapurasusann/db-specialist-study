#!/usr/bin/env python3
"""Local, automated Chromium smoke tests for the real DB study app.
Usage (in a local clone, with playwright Python package and Chrome/Chromium):
    python scripts/am2_browser_smoke.py
No cloud sync credentials or external API calls are required.
"""
from __future__ import annotations
import contextlib
import functools
import http.server
import os
from pathlib import Path
import shutil
import socket
import threading
import unittest

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        return

class BrowserSmoke(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = http.server.ThreadingHTTPServer(
            ("127.0.0.1", 0),
            functools.partial(QuietHandler, directory=str(ROOT))
        )
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.origin = f"http://127.0.0.1:{cls.server.server_address[1]}"
        cls.playwright = sync_playwright().start()
        chrome = next((shutil.which(x) for x in ("chromium", "chromium-browser", "google-chrome") if shutil.which(x)), None)
        opts = {"headless": True}
        if chrome:
            opts["executable_path"] = chrome
        cls.browser = cls.playwright.chromium.launch(**opts)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.playwright.stop()
        cls.server.shutdown()
        cls.server.server_close()

    def setUp(self):
        self.context = self.browser.new_context(viewport={"width": 1280, "height": 900})
        self.page = self.context.new_page()
        self.errors = []
        self.page.on("pageerror", lambda error: self.errors.append(str(error)))
        # External sync, telemetry, source PDFs are irrelevant to these tests.
        self.page.route("https://**/*", lambda route: route.abort())
        self.page.goto(self.origin + "/index.html", wait_until="domcontentloaded")
        self.page.locator("#viewStudy").click()
        self.page.locator("#currentTitle").wait_for(state="visible")

    def tearDown(self):
        try:
            self.assertFalse(self.errors, f"Browser JavaScript errors: {self.errors}")
        finally:
            self.context.close()

    def select(self, year, question):
        self.page.locator("#year").select_option(str(year))
        self.page.locator("#currentTitle").wait_for(state="visible")
        # Questions are clickable buttons in the grid.
        self.page.locator("#questions > button").nth(question - 1).click()
        self.assertIn(f"{year}年度", self.page.locator("#currentTitle").inner_text())
        self.assertIn(f"問{question}", self.page.locator("#currentTitle").inner_text())

    def test_2024_graph_and_diagram_choices(self):
        self.select(2024, 3)
        self.assertEqual(self.page.locator("#questionText figure svg").count(), 5)
        for svg in self.page.locator("#questionText figure svg").all():
            self.assertTrue(svg.get_attribute("viewBox"))
            self.assertGreater(svg.locator("text").count(), 0)
        self.select(2024, 6)
        self.assertEqual(self.page.locator("#questionText .optionText svg").count(), 4)

    def test_2024_tables_sql_and_question_navigation(self):
        self.select(2024, 7)
        self.assertEqual(self.page.locator("#questionText figure table").count(), 2)
        self.assertEqual(self.page.locator("#questionText figure pre").count(), 1)
        self.assertEqual(self.page.locator("#questionText .optionText").count(), 4)
        self.select(2024, 9)
        self.assertEqual(self.page.locator("#questionText .optionText table").count(), 4)
        self.select(2024, 10)
        self.assertIn("従業員番号［主キー］", self.page.locator("#questionText h3").inner_text())

    def test_2025_semantic_tables_and_sql(self):
        self.select(2025, 6)
        self.assertEqual(self.page.locator("#questionText figure table").count(), 1)
        self.assertEqual(self.page.locator("#questionText figure tbody tr").count(), 10)
        self.assertEqual(self.page.locator("#questionText figure thead th").count(), 9)
        self.select(2025, 9)
        self.assertEqual(self.page.locator("#questionText figure table").count(), 2)
        self.assertEqual(self.page.locator("#questionText figure pre").count(), 1)
        self.assertEqual(self.page.locator("#questionText figure tbody tr").count(), 6)

    def test_choice_grading_and_persistence(self):
        self.select(2024, 1)
        self.page.locator('#choices input[value="エ"]').check()
        self.page.locator("#grade").click()
        self.assertIn("正解", self.page.locator("#gradeResult").inner_text())
        self.assertEqual(self.page.evaluate("JSON.parse(localStorage.getItem('db-study-progress-v1'))['2024:am2:1'].correct"), True)
        self.page.reload(wait_until="domcontentloaded")
        self.page.locator("#viewStudy").click()
        self.page.locator("#year").select_option("2024")
        self.page.locator("#questions > button").first.click()
        self.assertIn("2024年度", self.page.locator("#currentTitle").inner_text())
        self.assertTrue(self.page.evaluate("JSON.parse(localStorage.getItem('db-study-progress-v1'))['2024:am2:1'].correct"))

    def test_mobile_basic_study_flow(self):
        self.page.set_viewport_size({"width": 390, "height": 844})
        self.select(2024, 8)
        self.assertEqual(self.page.locator("#questionText figure svg").count(), 1)
        self.assertEqual(self.page.locator("#questionText figure table").count(), 1)
        self.assertEqual(self.page.locator("#questionText figure pre").count(), 1)
        self.assertEqual(self.page.locator("#questionText .optionText").count(), 4)

if __name__ == "__main__":
    unittest.main(verbosity=2)
