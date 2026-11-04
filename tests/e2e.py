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
        elif kind in ("lanes", "kerb"):
            idx = await pg.evaluate("window.__hdCorrect()")
            check(idx >= 0, f"{ch}/{L['id']} card {cards}: no route choice is judged correct")
            choices = await pg.locator("#alt button").count()
            check(choices >= 2, f"{ch}/{L['id']} card {cards}: only {choices} route choice(s)")
            await pg.click("#showalt"); await pg.click(f"#alt button[data-c='{idx}']")
        elif kind == "stoppos":
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
        elif kind == "sort":
            k = await pg.evaluate("item()")
            try:
                await pg.wait_for_function("(()=>{const i=document.querySelector('#sc img');return i&&i.complete&&i.naturalWidth>0})()", timeout=5000)
            except Exception:
                check(False, f"{ch}/{L['id']}: sign image for {k} did not load")
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
        # ---- real drawn routes (mouse), Chapter 2 ----
        async def draw(points, holds=None):
            """points in SVG units; holds = {index: ms} pauses at that point"""
            box = await pg.locator("#f").bounding_box(); sc = box["width"] / 360
            X = lambda p: (box["x"] + p[0] * sc, box["y"] + p[1] * sc)
            await pg.mouse.move(*X(points[0])); await pg.mouse.down()
            for i, p in enumerate(points[1:], 1):
                await pg.mouse.move(*X(p), steps=8)
                if holds and i in holds: await pg.wait_for_timeout(holds[i])
            await pg.mouse.up()
            return await verdict(pg)
        async def goto_item(chap, level, i):
            await pg.click(f"#chap-{chap}"); await pg.click(f"#tab-{level}")
            await pg.evaluate(f"(()=>{{order=lv().items.map((_,k)=>k);idx={i};renderScenario();}})()")
        # 2.1 #2 road works: go round on the right and come back
        await goto_item("ch2", "keepleft", 1)
        v = await draw([(105, 265), (105, 225), (250, 190), (250, 100), (105, 55), (105, 25)])
        check(v == "Correct", f"drawn pass-and-return: {v}")
        # same item, straight through the cones
        await goto_item("ch2", "keepleft", 1)
        v = await draw([(105, 265), (105, 150), (105, 25)])
        msg = await pg.locator(".feedback span").nth(1).inner_text()
        check(v != "Correct" and "road works" in msg, f"drawn crash: {v} / {msg[:60]}")
        # 2.2 #4 three lanes: passing two lanes over is wrong
        await goto_item("ch2", "lanechoice", 3)
        v = await draw([(80, 265), (80, 220), (280, 190), (280, 90), (80, 45), (80, 25)])
        check(v != "Correct", f"drawn pass two lanes over should be wrong: {v}")
        # 2.4 into the car park, holding before the pavement
        await goto_item("ch2", "sidewalk", 0)
        v = await draw([(180, 275), (180, 182), (180, 140), (180, 60)], holds={1: 700})
        check(v == "Correct", f"drawn kerb with hold: {v}")
        await goto_item("ch2", "sidewalk", 0)
        v = await draw([(180, 275), (180, 182), (180, 140), (180, 60)])
        check(v != "Correct", f"drawn kerb without stopping should be wrong: {v}")
        drawn = 5  # answers given by the drawn-route checks above
        # ---- tracking ----
        t = await pg.evaluate("Track.totals()")
        check(t["answers"] == total + drawn, f"tracked answers {t['answers']} != played {total + drawn}")
        check(t["sessions"] == 1, f"expected 1 session, got {t['sessions']}")
        n_items = sum(len(L["items"]) for C in chapters for L in C["levels"])
        check(t["itemsSeen"] == n_items, f"items tracked {t['itemsSeen']} != {n_items}")
        weak = await pg.evaluate("Track.weakest(20)")
        check(len(weak) >= 3, f"expected missed items in 'needs work', got {len(weak)}")
        # 30-minute gap starts a new session
        await pg.evaluate("(()=>{const m=JSON.parse(localStorage.getItem('hd.v2.meta'));m.last-=31*60*1000;localStorage.setItem('hd.v2.meta',JSON.stringify(m));})()")
        await pg.reload(); await pg.wait_for_timeout(300)
        await pg.click("#chap-ch2"); await pg.click("#tab-keepleft"); await pg.click("#showalt"); await pg.click(f"#alt button[data-c='{await pg.evaluate('window.__hdCorrect()')}']")
        t2 = await pg.evaluate("Track.totals()")
        check(t2["sessions"] == 2 and t2["answers"] == total + drawn + 1, f"session split: {t2}")
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
        await pg2.click("#chap-ch2"); await pg2.click("#tab-keepleft"); await pg2.click("#showalt"); await pg2.click(f"#alt button[data-c='{await pg2.evaluate('window.__hdCorrect()')}']")
        check(await verdict(pg2) == "Correct", "private mode: answer failed")
        if EXPECT_ENGINE:
            check(engine_scenes == 6, f"engine scenes mounted: {engine_scenes}/6")
            # scenes must be torn down when the question changes (WebGL contexts are limited)
            check(await pg.evaluate("document.querySelectorAll('canvas').length") <= 1, "leaked canvases")
        # every official sign file loads
        broken = await pg.evaluate("""Promise.all(Object.keys(SIGNS).map(k=>new Promise(r=>{const i=new Image();i.onload=()=>r(i.naturalWidth>0?null:k);i.onerror=()=>r(k);i.src=SIGNS[k].src;}))).then(a=>a.filter(Boolean))""")
        check(not broken, f"sign images failed to load: {broken}")
        sw = await pg.evaluate("document.documentElement.scrollWidth")
        check(sw <= 400, f"horizontal scroll: {sw}")
        check(not errs, f"page errors: {errs}")
        await b.close()
        print(f"played {total} cards across {len(chapters)} chapters; engine scenes {engine_scenes}; {len(fails)} failures")
    sys.exit(1 if fails else 0)

asyncio.run(main())
