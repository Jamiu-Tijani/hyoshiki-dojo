"""End-to-end check: plays every item in every chapter with its correct answer,
answers one item wrong per level, and checks session tracking.

    python3 tests/e2e.py            (needs: pip install playwright; a Chromium build)

Exits non-zero on any failure. Uses file:// so no server is needed."""
import asyncio, json, os, pathlib, sys, time
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = os.environ.get("HD_URL") or (ROOT / "index.html").as_uri()
EXPECT_ENGINE = os.environ.get("HD_EXPECT_ENGINE") == "1"
engine_scenes = 0
LBL = {"straight": "Go straight", "left": "Turn left", "right": "Turn right", "uturn": "U-turn",
       "park": "Park 駐車", "stop": "Stop 停車"}
fails = []

def check(cond, msg):
    if not cond:
        fails.append(msg)
        print("FAIL:", msg)

async def verdict(pg):
    return await pg.locator(".verdict").inner_text()

async def play_level(pg, ch, L):
    """Answer every item correctly; for review-queue kinds also answer one wrong first."""
    await pg.click(f"#tab-{L['id']}")
    kind, items, n = L["kind"], L["items"], len(L["items"])
    cards, firsts_ok, wrong_done = 0, 0, False
    while True:
        cards += 1
        if kind == "signal":
            it = await pg.evaluate("item()")
            await pg.click("#showalt"); await pg.click(f"#alt button[data-k='{it['ok'][0]}']")
        elif kind == "plate":
            it = await pg.evaluate("item()")
            z = await pg.locator(f"#z-{it['ok']}").bounding_box()
            await pg.mouse.click(z["x"] + z["width"] / 2, z["y"] + z["height"] / 2)
        elif kind == "stoppos" or kind == "kerb":
            await pg.evaluate("""(()=>{const s=item();const f=document.getElementById('f');})()""")
            # tap the right spot in SVG units
            it = await pg.evaluate("item()")
            box = await pg.locator("#f").bounding_box(); sc = box["width"] / 360
            if kind == "stoppos":
                y, x = it["frontMin"] + 6, 150
            else:
                y, x = (176, 180) if it["dir"] == "in" else (114, 180)
            await pg.mouse.click(box["x"] + x * sc, box["y"] + y * sc)
            await pg.click("#confirm")
        elif kind == "bans":
            it = await pg.evaluate("item()")
            for k in it["banned"]:
                await pg.locator(f".move[aria-label='{LBL[k]}'] .hit").click(force=True)
            await pg.click("#check")
        elif kind == "approach":
            global engine_scenes
            if EXPECT_ENGINE:
                try:
                    await pg.wait_for_selector("#px:not([hidden]) canvas", timeout=15000)
                    engine_scenes += 1
                except Exception:
                    check(False, f"{ch}/{L['id']} card {cards}: Pixi scene did not mount")
            it = await pg.evaluate("item()")
            await pg.evaluate(f"(()=>{{const s=document.getElementById('spd');s.value={it['max']};s.dispatchEvent(new Event('input'))}})()")
            if it["horn"]: await pg.click("#horn")
            await pg.click("#drive")
        elif kind == "tf":
            it = await pg.evaluate("item()")
            a = it["a"] if wrong_done else (not it["a"])
            wrong_done = True
            await pg.click(f"#bin-{'true' if a else 'false'}")
        elif kind == "match":
            it = await pg.evaluate("item()")
            opts = await pg.locator(".kbin").evaluate_all("bs=>bs.map(b=>b.dataset.v)")
            check(it["a"] in opts and len(set(opts)) == 4, f"{ch}/{L['id']}: bad options {opts}")
            pick = it["a"] if wrong_done else [o for o in opts if o != it["a"]][0]
            wrong_done = True
            await pg.locator(f".kbin[data-v=\"{pick}\"]").click()
        elif kind == "build":
            it = await pg.evaluate("item()")
            seq = list(it["tiles"]) if wrong_done else [it["decoys"][0]] + list(it["tiles"][1:])
            wrong_done = True
            for t in seq: await pg.locator(f".tile[data-t=\"{t}\"]:not([disabled])").first.click()
        elif kind == "lanes":
            it = await pg.evaluate("item()")
            await pg.click(f".alt button[data-l='{it['ok'][0]}']")
        elif kind == "sort":
            k = await pg.evaluate("item()")
            cat = await pg.evaluate(f"SIGNS['{k}'].cat")
            await pg.click(f"#bin-{cat}")
        v = await verdict(pg)
        expect_wrong = kind in ("tf", "match", "build") and cards == 1
        check((v != "Correct") if expect_wrong else (v == "Correct"), f"{ch}/{L['id']} card {cards}: got {v}")
        if v == "Correct": firsts_ok += 1
        t = await pg.locator("#next").inner_text()
        await pg.click("#next")
        if t == "Finish": break
    requeue = kind in ("tf", "match", "build")
    check(cards == n + (1 if requeue else 0), f"{ch}/{L['id']}: {cards} cards for {n} items")
    score = await pg.locator(".big").inner_text()
    check(score == f"{n - (1 if requeue else 0)} / {n}", f"{ch}/{L['id']}: score {score}")
    return cards

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={"width": 400, "height": 900})
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        if "--no-engine" in sys.argv:
            await pg.add_init_script("window.HD_NO_ENGINE=true")
        await pg.goto(URL); await pg.wait_for_timeout(300)
        await pg.evaluate("localStorage.clear()"); await pg.reload(); await pg.wait_for_timeout(300)
        total = 0
        chapters = await pg.evaluate("CHAPTERS.map(c=>({id:c.id,levels:c.levels.map(l=>({id:l.id,kind:l.kind||l.id,items:l.items}))}))")
        for C in chapters:
            await pg.click(f"#chap-{C['id']}")
            for L in C["levels"]:
                total += await play_level(pg, C["id"], L)
        # ---- tracking ----
        t = await pg.evaluate("Track.totals()")
        check(t["answers"] == total, f"tracked answers {t['answers']} != played {total}")
        check(t["sessions"] == 1, f"expected 1 session, got {t['sessions']}")
        n_items = sum(len(L["items"]) for C in chapters for L in C["levels"])
        check(t["itemsSeen"] == n_items, f"items tracked {t['itemsSeen']} != {n_items}")
        weak = await pg.evaluate("Track.weakest(20)")
        check(len(weak) >= 3, f"expected missed items in 'needs work', got {len(weak)}")
        # 30-minute gap starts a new session
        await pg.evaluate("(()=>{const m=JSON.parse(localStorage.getItem('hd.v2.meta'));m.last-=31*60*1000;localStorage.setItem('hd.v2.meta',JSON.stringify(m));})()")
        await pg.reload(); await pg.wait_for_timeout(300)
        await pg.click("#chap-ch2"); await pg.click("#tab-keepleft"); await pg.click(".alt button[data-l='0']")
        t2 = await pg.evaluate("Track.totals()")
        check(t2["sessions"] == 2 and t2["answers"] == total + 1, f"session split: {t2}")
        # History panel
        await pg.click("#history-btn")
        rows = await pg.locator(".hist tbody tr").count()
        check(rows == 2, f"history rows {rows}")
        check(await pg.locator(".weak li").count() >= 3, "needs-work list empty")
        await pg.click("#hclear"); await pg.click("#hyes")
        check((await pg.evaluate("Track.totals()"))["answers"] == 0, "clear did not clear")
        await pg.click("#hback")
        # Private mode: localStorage throws
        pg2 = await b.new_page(viewport={"width": 400, "height": 900})
        pg2.on("pageerror", lambda e: errs.append("private: " + str(e)))
        await pg2.add_init_script("Object.defineProperty(window,'localStorage',{get(){throw new Error('denied')}})")
        await pg2.goto(URL); await pg2.wait_for_timeout(300)
        await pg2.click("#chap-ch2"); await pg2.click("#tab-keepleft"); await pg2.click(".alt button[data-l='0']")
        check(await verdict(pg2) == "Correct", "private mode: answer failed")
        if EXPECT_ENGINE:
            check(engine_scenes == 6, f"engine scenes mounted: {engine_scenes}/6")
            # scenes must be torn down when the question changes (WebGL contexts are limited)
            check(await pg.evaluate("document.querySelectorAll('canvas').length") <= 1, "leaked canvases")
        sw = await pg.evaluate("document.documentElement.scrollWidth")
        check(sw <= 400, f"horizontal scroll: {sw}")
        check(not errs, f"page errors: {errs}")
        await b.close()
        print(f"played {total} cards across {len(chapters)} chapters; engine scenes {engine_scenes}; {len(fails)} failures")
    sys.exit(1 if fails else 0)

asyncio.run(main())
