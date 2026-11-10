"""Run with python tests/check.py. No test data leaves the test browser.

The script starts its own temporary web server and uses an isolated browser.
Use --static-only for file checks, or --base-url URL to test a published copy.
Install a browser if needed: python -m playwright install chromium
"""

import argparse
import os
from contextlib import contextmanager
from functools import partial
from html.parser import HTMLParser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parent.parent
PAGES = sorted(ROOT.glob("*.html"))
STORAGE_KEY = "atelier-exhibitions-v1"


class Document(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags = []
        self.ids = set()
        self.links = []
        self.references = []
        self.scripts = []

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        self.tags.append(tag)
        if "id" in attrs:
            assert attrs["id"] not in self.ids, f"Duplicate ID: {attrs['id']}"
            self.ids.add(attrs["id"])
        assert tag != "style" and "style" not in attrs, "Use a CSS file for styles"
        assert not any(key.startswith("on") for key in attrs), "Use JS event listeners"
        if tag == "img":
            assert attrs.get("alt"), "An artwork needs an image description"
        if tag == "script":
            assert attrs.get("src") and "defer" in attrs, "Use deferred script files"
            self.scripts.append(attrs["src"])
        for key in ("href", "src", "action"):
            if key in attrs:
                self.links.append(attrs[key])
        for key in ("for", "aria-labelledby", "aria-describedby", "aria-controls"):
            self.references.extend(attrs.get(key, "").split())


def check_files():
    documents = {}
    for path in PAGES:
        document = Document()
        document.feed(path.read_text(encoding="utf-8"))
        assert all(document.tags.count(tag) == 1 for tag in ("header", "main", "footer", "h1")), path.name
        assert all(reference in document.ids for reference in document.references), f"Broken field/ARIA reference: {path.name}"
        if document.scripts:
            assert document.scripts[0] == "vendor/jquery.min.js", "Load jQuery before application scripts"
        documents[path.name] = document

    for path in PAGES:
        for link in documents[path.name].links:
            url = urlsplit(link)
            if url.scheme or url.netloc:
                continue
            target = ROOT / unquote(url.path) if url.path else path
            assert target.exists(), f"{path.name}: missing {link}"
            if url.fragment and target.suffix == ".html":
                assert url.fragment in documents[target.name].ids, f"{path.name}: broken fragment {link}"
    assert len(PAGES) == 8
    assert (ROOT / "js/script.js").is_file()
    assert (ROOT / "vendor/jquery-LICENSE.txt").is_file()
    print(f"PASS: {len(PAGES)} pages, local links, labels, ARIA references, semantic structure, and script order.", flush=True)


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


@contextmanager
def local_site():
    handler = partial(QuietHandler, directory=str(ROOT))
    server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        yield f"http://127.0.0.1:{server.server_port}/"
    finally:
        server.shutdown()
        server.server_close()
        thread.join()


def check_gallery(page, base, expect):
    page.goto(base + "gallery.html")
    cards = page.locator("#artwork-grid .art-card:visible")
    expect(cards).to_have_count(6)
    page.locator("#gallery-search").fill("  MIRA  ")
    expect(cards).to_have_count(2)
    page.locator('.filter-button[data-category="abstract"]').click()
    expect(cards).to_have_count(1)
    expect(cards.first).to_have_attribute("id", "warm-earth")
    cards.first.locator("a").click()
    expect(page.locator("#art-lightbox")).to_be_visible()
    expect(page.locator("#lightbox-next")).to_be_disabled()
    expect(page.locator("#lightbox-title")).to_have_text("Warm Earth")
    page.keyboard.press("Escape")
    expect(page.locator("#art-lightbox")).to_be_hidden()
    expect(page.locator("#warm-earth a")).to_be_focused()

    page.locator("#gallery-search").fill("no-such-artwork")
    expect(cards).to_have_count(0)
    expect(page.locator("#gallery-empty")).to_be_visible()
    page.locator("#clear-gallery").click()
    expect(cards).to_have_count(6)
    page.locator("#quiet-sun a").click()
    expect(page.locator("#lightbox-close")).to_be_focused()
    page.keyboard.press("Shift+Tab")
    expect(page.locator("#lightbox-next")).to_be_focused()
    page.keyboard.press("Tab")
    expect(page.locator("#lightbox-close")).to_be_focused()
    page.keyboard.press("ArrowLeft")
    expect(page.locator("#lightbox-title")).to_have_text("Coastal Lines")
    page.locator("#lightbox-next").click()
    expect(page.locator("#lightbox-title")).to_have_text("Quiet Sun")
    page.locator("#lightbox-close").click()
    expect(page.locator("#quiet-sun a")).to_be_focused()
    print("PASS: combined live search, categories, empty/reset, filtered lightbox, wrapping, keyboard and focus.", flush=True)


def check_forms(page, base, expect):
    page.goto(base + "register.html")
    page.locator("#registration-submit").click()
    expect(page.locator("#registration-errors")).to_be_visible()
    expect(page.locator("#register-name")).to_be_focused()
    page.locator("#register-name").fill("   ")
    expect(page.locator("#register-name")).to_have_attribute("aria-invalid", "true")
    page.locator("#register-name").fill("Sample Visitor")
    page.locator("#register-email").fill("invalid-email")
    expect(page.locator("#register-email")).to_have_attribute("aria-invalid", "true")
    page.locator("#register-email").fill("sample@example.com")

    for password, strength in (("abc", "1"), ("Gallery26", "2"), ("Gallery2026!", "3")):
        page.locator("#register-password").fill(password)
        expect(page.locator("#password-strength")).to_have_attribute("data-strength", strength)
    page.locator("#register-confirm").fill("different")
    page.locator("#registration-submit").click()
    expect(page.locator("#register-confirm")).to_have_attribute("aria-invalid", "true")
    page.locator("#register-confirm").fill("Gallery2026!")
    page.locator("#toggle-passwords").click()
    expect(page.locator("#register-password")).to_have_attribute("type", "text")
    page.locator("#registration-submit").click()
    expect(page.locator("#registration-success")).to_be_visible()
    for field in ("name", "email", "password", "confirm"):
        expect(page.locator("#register-" + field)).to_have_value("")
    assert page.evaluate("localStorage.length === 0 && sessionStorage.length === 0"), "Forms must not save credentials"

    page.locator("#register-password").fill("Gallery2026!")
    page.get_by_role("button", name="Clear form").click()
    expect(page.locator("#password-strength")).to_have_attribute("data-strength", "0")
    expect(page.locator("#register-password")).to_have_value("")

    page.goto(base + "contact.html")
    page.locator("#contact-submit").click()
    expect(page.locator("#contact-errors")).to_be_visible()
    page.locator("#visitor-name").fill("Sample Visitor")
    page.locator("#visitor-email").fill("sample@example.com")
    page.locator("#message").fill("   ")
    page.locator("#contact-submit").click()
    expect(page.locator("#message")).to_have_attribute("aria-invalid", "true")
    page.locator("#message").fill("A sample question about the collection.")
    page.locator("#contact-submit").click()
    page.wait_for_url("**/thank-you.html")
    assert "?" not in page.url and "sample" not in page.url
    print("PASS: required/whitespace/RegEx validation, three password strengths, match, reset, success, and no saved credentials.", flush=True)


def fill_exhibition(page, title):
    page.locator("#exhibition-title").fill(title)
    page.locator("#exhibition-theme").fill("Nature and color")
    page.locator("#exhibition-works").fill("Garden Notes, Quiet Sun")
    page.locator("#exhibition-artwork").select_option("garden-notes")


def confirm_click(page, selector, accept):
    page.once("dialog", lambda dialog: dialog.accept() if accept else dialog.dismiss())
    page.locator(selector).click()


def check_exhibitions(page, base, expect):
    page.goto(base + "exhibitions.html")
    rows = page.locator("#exhibition-rows tr")
    expect(rows).to_have_count(3)
    page.locator("#save-exhibition").click()
    expect(page.locator("#exhibition-title")).to_have_attribute("aria-invalid", "true")
    fill_exhibition(page, "A sample exhibition")
    page.locator("#save-exhibition").click()
    expect(rows).to_have_count(4)
    page.reload()
    expect(rows).to_have_count(4)
    rows.last.locator(".edit-exhibition").click()
    page.locator("#exhibition-title").fill("Unsaved change")
    page.locator("#cancel-edit").click()
    expect(rows.last.locator("th")).to_have_text("A sample exhibition")
    rows.last.locator(".edit-exhibition").click()
    page.locator("#exhibition-title").fill("Updated exhibition")
    page.locator("#save-exhibition").click()
    expect(rows.last.locator("th")).to_have_text("Updated exhibition")
    page.reload()
    expect(rows.last.locator("th")).to_have_text("Updated exhibition")
    confirm_click(page, "#exhibition-rows tr:last-child .delete-exhibition", False)
    expect(rows).to_have_count(4)
    confirm_click(page, "#exhibition-rows tr:last-child .delete-exhibition", True)
    expect(rows).to_have_count(3)

    # User text must stay text, even when it resembles markup.
    literal = '<img src=x onerror="alert(1)">'
    fill_exhibition(page, literal)
    page.locator("#save-exhibition").click()
    expect(rows.last.locator("th")).to_have_text(literal)
    expect(rows.last.locator("img")).to_have_count(0)
    confirm_click(page, "#reset-exhibitions", False)
    expect(rows).to_have_count(4)
    confirm_click(page, "#reset-exhibitions", True)
    expect(rows).to_have_count(3)

    # Empty and damaged saved data must not crash the page.
    page.evaluate("key => localStorage.setItem(key, '[]')", STORAGE_KEY)
    page.reload()
    expect(page.locator("#exhibition-count")).to_have_text("0 exhibitions")
    expect(page.locator(".empty-table")).to_be_visible()
    page.evaluate("key => localStorage.setItem(key, '{broken json')", STORAGE_KEY)
    page.reload()
    expect(rows).to_have_count(3)
    expect(page.locator("#storage-warning")).to_be_visible()
    confirm_click(page, "#reset-exhibitions", True)
    print("PASS: complete CRUD, confirmations/cancel, persistence, literal text safety, empty/corrupt data recovery.", flush=True)


def check_browser(base, screenshots):
    try:
        from playwright.sync_api import expect, sync_playwright
    except ImportError:
        raise SystemExit("Install test dependencies: python -m pip install -r requirements-dev.txt")
    with sync_playwright() as playwright:
        chrome = os.environ.get("CHROME_PATH")
        if not chrome and os.name == "nt":
            system_chrome = Path("C:/Program Files/Google/Chrome/Application/chrome.exe")
            if system_chrome.exists():
                chrome = str(system_chrome)
        try:
            browser = playwright.chromium.launch(headless=True, **({"executable_path": chrome} if chrome else {}))
        except Exception as error:
            raise SystemExit("Install a test browser: python -m playwright install chromium\nOr set CHROME_PATH to Chrome's executable.\n" + str(error))
        context = browser.new_context(reduced_motion="reduce")
        # The site has system font fallbacks; tests need no Google Fonts network.
        context.route("https://fonts.googleapis.com/**", lambda route: route.abort())
        context.route("https://fonts.gstatic.com/**", lambda route: route.abort())
        page = context.new_page()
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))

        for width in (1440, 834, 390, 320):
            page.set_viewport_size({"width": width, "height": 1000})
            for path in PAGES:
                response = page.goto(base + path.name)
                assert response and response.status == 200, f"HTTP failure: {path.name}"
                assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), f"Overflow: {path.name} at {width}px"
                expect(page.locator("nav a")).to_have_count(7)
                page.locator("img").evaluate_all("images => Promise.all(images.map(image => { image.loading = 'eager'; return image.decode(); }))")
                if screenshots and width in (1440, 390) and path.name in ("index.html", "gallery.html", "register.html", "exhibitions.html"):
                    output = ROOT / ".qa"
                    output.mkdir(exist_ok=True)
                    page.screenshot(path=str(output / f"{path.stem}-{width}.png"), full_page=True)
            print(f"PASS: all {len(PAGES)} pages, images, and navigation at {width}px with no overflow.", flush=True)

        # Run real interactions on both desktop and phone widths.
        for width in (1440, 390):
            page.set_viewport_size({"width": width, "height": 1000})
            page.goto(base)
            page.evaluate("localStorage.clear(); sessionStorage.clear()")
            check_gallery(page, base, expect)
            check_forms(page, base, expect)
            check_exhibitions(page, base, expect)

        # Failure to persist still permits editing in the current tab.
        blocked = browser.new_context()
        blocked.add_init_script("Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage disabled'); } });")
        blocked_page = blocked.new_page()
        blocked_page.goto(base + "exhibitions.html")
        fill_exhibition(blocked_page, "Unsaved but usable")
        blocked_page.locator("#save-exhibition").click()
        expect(blocked_page.locator("#exhibition-rows tr")).to_have_count(4)
        expect(blocked_page.locator("#storage-warning")).to_be_visible()
        blocked.close()

        fallback = browser.new_context(java_script_enabled=False)
        fallback_page = fallback.new_page()
        fallback_page.goto(base + "gallery.html")
        expect(fallback_page.locator("#artwork-grid .art-card:visible")).to_have_count(6)
        expect(fallback_page.locator("#gallery-controls")).to_be_hidden()
        fallback_page.goto(base + "register.html")
        expect(fallback_page.locator("#registration-submit")).to_be_disabled()
        fallback.close()
        assert not errors, "Browser errors: " + "; ".join(errors)
        browser.close()
        print("PASS: disabled storage, no-JavaScript fallback, and no JavaScript runtime errors.", flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--static-only", action="store_true")
    parser.add_argument("--screenshots", action="store_true", help="Save desktop/mobile screenshots under ignored .qa/")
    parser.add_argument("--base-url", help="Test an existing HTTP(S) deployment instead of starting a local server")
    args = parser.parse_args()
    check_files()
    if not args.static_only:
        if args.base_url:
            check_browser(args.base_url.rstrip("/") + "/", args.screenshots)
        else:
            with local_site() as base:
                check_browser(base, args.screenshots)
    print("All checks passed.", flush=True)


if __name__ == "__main__":
    main()
