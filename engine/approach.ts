import { Application, Container, Graphics, Sprite, Text } from "pixi.js";
import { gsap } from "gsap";
import { engineHum, horn } from "./audio";
import { svgTexture } from "./svg";

export interface ApproachOptions {
  /** inner SVG markup of the sign, 100×100 viewBox */
  signSvg: string;
  stopLine?: boolean;
  crosswalk?: boolean;
  peds?: boolean;
  curve?: boolean;
  reducedMotion?: boolean;
}

export interface ApproachScene {
  /** Drive toward the line at `speed` km/h (0 = brake to a stop at the line). Resolves when the motion ends. */
  drive(o: { speed: number; horn: boolean }): Promise<void>;
  destroy(): void;
}

/* Logical size; the canvas scales to its container. Same geometry as the SVG version. */
const W = 360, H = 360;
const ROAD_X0 = 120, ROAD_X1 = 240, LANE_X = 150;
const CAR_Y = 318, CAR_FRONT = CAR_Y - 25;
const WORLD_TOP = -2400;

const C = {
  field: 0x2b3a30, road: 0x3c4248, line: 0xf2f2ee, kerb: 0xa9a39a, tree: 0x2f5a3a, treeDark: 0x24472e,
  car: 0xf4f7fa, glass: 0x5c7a99, lamp: 0xffd76a, outline: 0x11161a, ped: 0xff8a3d, horn: 0xffd76a, post: 0x9aa0a6,
};

function drawCar(): Container {
  const g = new Graphics();
  g.roundRect(-15, -25, 30, 50, 7).fill(C.car).stroke({ width: 2, color: C.outline });
  g.roundRect(-11, -16, 22, 11, 3).fill(C.glass);
  g.roundRect(-11, 12, 22, 7, 2).fill(C.glass);
  g.rect(-13, -24, 6, 3).fill(C.lamp);
  g.rect(7, -24, 6, 3).fill(C.lamp);
  const brake = new Graphics();
  brake.rect(-13, 22, 7, 3).fill(0xff3b30);
  brake.rect(6, 22, 7, 3).fill(0xff3b30);
  brake.alpha = 0;
  brake.label = "brake";
  const c = new Container();
  c.addChild(g, brake);
  return c;
}

function drawPedestrian(): Container {
  const g = new Graphics();
  g.circle(0, -12, 5).fill(C.ped).stroke({ width: 1.5, color: C.outline });
  g.moveTo(0, -7).lineTo(0, 6).moveTo(0, 6).lineTo(-5, 14).moveTo(0, 6).lineTo(5, 14)
    .moveTo(0, -3).lineTo(-6, 2).moveTo(0, -3).lineTo(6, 2)
    .stroke({ width: 3.5, color: C.ped, cap: "round" });
  const c = new Container();
  c.addChild(g);
  return c;
}

export async function mountApproach(host: HTMLElement, o: ApproachOptions): Promise<ApproachScene> {
  const app = new Application();
  await app.init({
    width: W,
    height: H,
    antialias: true,
    backgroundColor: C.field,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    autoDensity: true,
    preference: "webgl",
  });
  const canvas = app.canvas;
  canvas.style.width = "100%";
  canvas.style.height = "auto";
  canvas.style.display = "block";
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", "road approach");
  host.appendChild(canvas);

  /* ---------- world (scrolls) ---------- */
  const world = new Container();
  app.stage.addChild(world);
  const ground = new Graphics();
  ground.rect(0, WORLD_TOP, W, H - WORLD_TOP).fill(C.field);
  ground.rect(ROAD_X0, WORLD_TOP, ROAD_X1 - ROAD_X0, H - WORLD_TOP).fill(C.road);
  ground.rect(ROAD_X0 - 6, WORLD_TOP, 6, H - WORLD_TOP).fill(C.kerb);
  ground.rect(ROAD_X1, WORLD_TOP, 6, H - WORLD_TOP).fill(C.kerb);
  for (let y = H; y > WORLD_TOP; y -= 26) ground.rect(178.5, y - 16, 3, 16).fill(C.line);
  // roadside trees give a sense of speed
  for (let y = H - 40, i = 0; y > WORLD_TOP; y -= 70, i++) {
    const lx = 40 + ((i * 37) % 50), rx = 290 + ((i * 53) % 50);
    ground.circle(lx, y, 14 + (i % 3) * 3).fill(i % 2 ? C.tree : C.treeDark);
    ground.circle(rx, y - 30, 13 + (i % 4) * 2).fill(i % 2 ? C.treeDark : C.tree);
  }
  world.addChild(ground);

  // the place you are approaching (same y as the SVG version)
  let lineY = 250;
  const marks = new Graphics();
  if (o.stopLine) {
    marks.rect(0, 30, W, 60).fill(C.road); // cross street
    marks.rect(ROAD_X0, 100, 60, 5).fill(C.line);
    lineY = 105;
  }
  if (o.crosswalk) {
    for (let i = 0; i < 8; i++) marks.rect(124 + i * 15, 90, 8, 24).fill(C.line);
    marks.poly([150, 150, 160, 160, 150, 170, 140, 160]).stroke({ width: 2, color: C.line });
    lineY = 118;
  }
  if (o.curve) {
    marks.rect(ROAD_X1 + 6, -260, W, 330).fill(C.treeDark);
    marks.rect(0, -300, W, 60).fill(C.road); // the bend
  }
  world.addChild(marks);

  let ped: Container | null = null;
  if (o.peds) {
    ped = drawPedestrian();
    ped.position.set(108, 106);
    world.addChild(ped);
  }

  const signTex = await svgTexture(o.signSvg, 96);
  const sign = new Sprite(signTex);
  sign.width = sign.height = 42;
  sign.position.set(70, 186);
  const post = new Graphics().rect(89.5, 228, 3, 22).fill(C.post);
  world.addChild(post, sign);

  /* ---------- car (fixed on screen) ---------- */
  const car = drawCar();
  car.position.set(LANE_X, CAR_Y);
  app.stage.addChild(car);
  const brake = car.getChildByLabel("brake") as Graphics;

  /* idle: a slight engine idle wobble */
  const idle = o.reducedMotion ? null : gsap.to(car, { y: CAR_Y - 0.6, duration: 0.12, repeat: -1, yoyo: true, ease: "sine.inOut" });

  let destroyed = false;
  let hum: ReturnType<typeof engineHum> | null = null;

  function popHorn(): void {
    const t = new Text({ text: "プッ ♪", style: { fontFamily: "sans-serif", fontSize: 14, fontWeight: "700", fill: C.horn } });
    t.position.set(LANE_X + 22, CAR_Y - 30);
    app.stage.addChild(t);
    if (o.reducedMotion) return;
    gsap.fromTo(t, { alpha: 0, y: CAR_Y - 20 }, { alpha: 1, y: CAR_Y - 44, duration: 0.25, ease: "back.out(2)" });
    gsap.to(t, { alpha: 0, duration: 0.4, delay: 0.9 });
  }

  return {
    async drive({ speed, horn: sound }) {
      if (destroyed) return;
      idle?.kill();
      if (sound) { horn(); popHorn(); }
      const stopAt = CAR_FRONT - (lineY + 2); // world.y that puts the car's front just behind the line
      if (o.reducedMotion) {
        world.y = speed === 0 ? stopAt : 900;
        return;
      }
      hum = engineHum(speed === 0 ? 30 : speed);
      if (speed === 0) {
        // approach at 30 km/h, then brake to a stop at the line
        const tl = gsap.timeline();
        tl.to(world, { y: stopAt - 90, duration: 0.9, ease: "none" })
          .to(world, {
            y: stopAt, duration: 1.1, ease: "power2.out",
            onStart: () => { gsap.to(brake, { alpha: 1, duration: 0.15 }); hum?.setSpeed(8); },
          })
          .to(car, { y: CAR_Y + 2, duration: 0.12, yoyo: true, repeat: 1, ease: "sine.inOut" }, "-=0.1");
        await tl;
        hum.stop();
        if (ped && !destroyed) {
          // with the car stopped, the pedestrian crosses
          await gsap.to(ped, { x: 270, duration: 2.2, ease: "none" });
        }
        return;
      }
      // keep going past the line; distance per second scales with speed
      const pxPerSec = 6 + speed * 6;
      const dist = 900;
      await gsap.to(world, { y: dist, duration: dist / pxPerSec, ease: "power1.in" });
      hum.stop();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      hum?.stop();
      gsap.killTweensOf([world, car, brake, ped].filter(Boolean));
      idle?.kill();
      app.destroy(true, { children: true, texture: true, textureSource: true });
    },
  };
}
