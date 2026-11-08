"""Smoke test for the React app scaffold (docs/redesign.md, Phase 1).

    HD_URL=http://127.0.0.1:4173/ python3 tests/app_smoke.py      (serve dist/ first)

Checks routing (tabs, old #ch deep links, focused level route), self-hosted fonts, tokens in both
themes, phone layout, focus after navigation, the link back to the old game, and no console errors.
Exits non-zero on any failure."""
import asyncio, os, sys
from playwright.async_api import async_playwright

BASE = (os.environ.get("HD_URL") or "http://127.0.0.1:4173/").rstrip("/") + "/"
APP = BASE + "app/"
fails = []

def check(cond, msg):
    if not cond:
        fails.append(msg)
        print("FAIL:", msg)

async def h1(pg):
    return (await pg.locator("h1").inner_text()).strip()

async def current_tab(pg):
    loc = pg.locator("nav[aria-label='Main'] a[aria-current='page']")
    return (await loc.get_attribute("data-tab")) if await loc.count() == 1 else None

async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch()
        ctx = await br.new_context(viewport={"width": 390, "height": 844}, reduced_motion="reduce")
        pg = await ctx.new_page()
        errors = []
        pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        pg.on("pageerror", lambda e: errors.append(str(e)))
        pg.on("requestfailed", lambda r: errors.append(f"request failed: {r.url}"))

        # Home + tab bar
        await pg.goto(APP); await pg.wait_for_selector("h1")
        check(await h1(pg) == "Hyōshiki Dojo", f"home h1: {await h1(pg)!r}")
        check(await pg.locator("nav[aria-label='Main'] a").count() == 3, "tab bar should have 3 links")
        check(await current_tab(pg) == "home", "home tab should be current")

        # Fonts are self-hosted and actually used
        await pg.evaluate("document.fonts.ready")
        loaded = await pg.evaluate("[...document.fonts].filter(f=>f.status==='loaded').map(f=>f.family.replace(/\"/g,''))")
        check("Plus Jakarta Sans" in loaded, f"Plus Jakarta Sans not loaded: {loaded}")
        check("Noto Sans JP Subset" in loaded, f"Noto Sans JP Subset not loaded: {loaded}")
        num = await pg.evaluate("getComputedStyle(document.body).fontVariantNumeric")
        check("tabular-nums" in num, f"body numerals not tabular: {num}")

        # Tabs navigate by hash; heading takes focus for screen readers
        await pg.click("nav[aria-label='Main'] a[data-tab='learn']"); await pg.wait_for_function("location.hash==='#learn'")
        await pg.wait_for_function("document.querySelector('h1')?.textContent==='Learn'")
        check(await current_tab(pg) == "learn", "learn tab should be current")
        await pg.wait_for_function("document.activeElement?.tagName==='H1'", timeout=2000)

        # Old deep links: chapter screen under the Learn tab
        await pg.click("nav[aria-label='Chapters'] a[href='#ch1']")
        await pg.wait_for_function("document.querySelector('h1')?.textContent==='Chapter 1'")
        check(await current_tab(pg) == "learn", "chapter should highlight Learn")
        for cid, title in [("ch2", "Chapter 2"), ("bonus", "Bonus")]:
            await pg.goto(APP + "#" + cid); await pg.wait_for_selector("h1")
            check(await h1(pg) == title, f"#{cid} direct load h1: {await h1(pg)!r}")

        # Focused level route: no tab bar, close goes back to the chapter
        await pg.goto(APP + "#ch2/keepleft"); await pg.wait_for_selector("h1")
        check(await pg.locator("nav[aria-label='Main']").count() == 0, "level route must hide the tab bar")
        check(await pg.locator("a[aria-label^='Close']").get_attribute("href") == "#ch2", "close should link to #ch2")

        # Unknown hash falls back to Home; Progress tab
        await pg.goto(APP + "#nope"); await pg.wait_for_selector("h1")
        check(await h1(pg) == "Hyōshiki Dojo", "unknown hash should show Home")
        await pg.click("nav[aria-label='Main'] a[data-tab='progress']")
        await pg.wait_for_function("document.querySelector('h1')?.textContent==='Progress'")

        # Phone layout: no horizontal scroll
        overflow = await pg.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
        check(overflow <= 0, f"horizontal overflow {overflow}px at 390px wide")

        # Tokens: light and dark backgrounds come from tokens.css
        bg_light = await pg.evaluate("getComputedStyle(document.body).backgroundColor")
        await pg.emulate_media(color_scheme="dark")
        bg_dark = await pg.evaluate("getComputedStyle(document.body).backgroundColor")
        check(bg_light == "rgb(246, 245, 241)", f"light --bg: {bg_light}")
        check(bg_dark == "rgb(20, 21, 23)", f"dark --bg: {bg_dark}")
        await pg.emulate_media(color_scheme="light")

        # Link back to the old game resolves to the live game at the site root.
        # Errors are checked first: the old game's own requests (e.g. Google Fonts) are not this test's concern.
        await pg.goto(APP + "#ch2"); await pg.wait_for_selector("h1")
        check(not errors, f"console/page errors in the app: {errors}")
        await pg.click("text=Open the current game"); await pg.wait_for_load_state("load")
        check(pg.url == BASE + "#ch2", f"old-game link went to {pg.url}")
        check(await pg.locator("#chapters").count() == 1, "old game did not load from the app link")
        await br.close()
    print(f"app smoke: {len(fails)} failures")
    sys.exit(1 if fails else 0)

asyncio.run(main())
