import * as d3 from "d3";
import * as d3V from 'd3-geo-voronoi';
import { GeoJson, GeoJsonFeature, GeoJsonMultiPolygon, GeoJsonPolygon } from "../models/geojson";

class Layer {
  constructor(public name: string = '', public limit: Line[] = [], public innerLayers: Layer[] = []) { }

  public shrunk(): Layer {
    const layer = [...this.limit];
    const array = [];
    let runner: Line = layer[0].copy;
    for (let i = 1; i < layer.length; i++) {
      if (runner.isCollinear(layer[i].end)) {
        runner = new Line(runner.start, layer[i].end);
      } else {
        array.push(runner.copy);
        runner = layer[i].copy;
      }
    }
    array.push(runner.copy);
    return new Layer(this.name, array, this.innerLayers);
  }

  public inside(point: Point) {
    let inside = false;
    for (let i = 0, j = this.limit.length - 1; i < this.limit.length; j = i++) {
      const xi = this.limit[i].start.X, yi = this.limit[i].start.Y;
      const xj = this.limit[j].start.X, yj = this.limit[j].start.Y;

      const intersect = ((yi > point.Y) != (yj > point.Y)) && (point.X < (xj - xi) * (point.Y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  public AsSvgPath(circular: boolean = true): string {
    let path = '';
    if (this.limit.length > 0) {
      path = 'M ';
      this.limit.forEach((vector, idx) => {
        path += `${idx > 0 ? 'L ' : ''}${vector.start.X} ${vector.start.Y} `;
      });
      if (circular)
        path += `Z `;
    }
    this.innerLayers.forEach(layer => {
      path += layer.AsSvgPath();
    });
    return path;
  }

  public AsGeoJsonFeature(): GeoJsonFeature {
    const geoPaths: number[][][] = [];
    this.innerLayers.forEach((layer) => {
      const geoPath: number[][] = [];

      layer.limit.forEach((line) => {
        geoPath.push(line.start.toVector());
      });

      layer.innerLayers.forEach((layer2) => {
        layer2.limit.forEach((line2) => {
          geoPath.push(line2.start.toVector());
        });
      });

      geoPaths.push(geoPath);
    });

    return new GeoJsonFeature(new GeoJsonPolygon(geoPaths), { 'layer': this.name });
  }

  public static ToGeoJson(layers: Layer[]): GeoJson {
    const geoJsonArray: number[][][][] = [];

    layers.forEach((layer) => {
      const geoPaths: number[][][] = [];
      layer.innerLayers.forEach((layer2) => {
        const geoPath: number[][] = [];

        layer2.limit.forEach((line) => {
          geoPath.push(line.start.toVector());
        });

        layer2.innerLayers.forEach((layer3) => {
          layer3.limit.forEach((line2) => {
            geoPath.push(line2.start.toVector());
          });
        });

        geoPaths.push(geoPath);
      });

      geoJsonArray.push(geoPaths);
    })

    return GeoJson.Build(new GeoJsonMultiPolygon(geoJsonArray));
  }

  public static Generate(name: string, allLines: Line[]): Layer {
    const copyLines = [...allLines];
    const closedCircuits: Layer[] = [];
    while (copyLines.length > 0) {
      const lines: Line[] = [];
      const startVector = copyLines.pop()!;
      lines.push(startVector.copy);
      let runner = startVector.copy;
      while (!runner.end.equals(startVector.start)) {
        let vectorIdx = copyLines.findIndex((v) => runner.end.equals(v.start));
        let isInverted = false;
        if (vectorIdx === -1) {
          vectorIdx = copyLines.findIndex((v) => runner.end.equals(v.end));
          isInverted = true;
        }
        runner = copyLines.splice(vectorIdx, 1)[0].copy;
        if (isInverted) {
          runner = new Line(runner.end, runner.start);
        }
        lines.push(runner.copy);
      }
      closedCircuits.push(new Layer(name, lines).shrunk());
    }
    const layer = new Layer(name);
    layer.innerLayers = closedCircuits;
    layer.ProcessNew();
    return layer;
  }

  public static DefaultSort(l1: Layer, l2: Layer): number {
    if (l1.limit.length > l2.limit.length)
      return 1;
    if (l1.limit.length < l2.limit.length)
      return -1
    return 0;
  }

  public ProcessNew() {
    this.innerLayers.sort(Layer.DefaultSort);
    let runner: Layer | undefined = this;
    const runnerCopyInnerLayers = [...runner.innerLayers];
    while (runner !== undefined) {
      const copyInnerLayers = [...runner.innerLayers];
      for (let i = 0; i < copyInnerLayers.length; i++) {
        for (let j = runner.innerLayers.length - 1; j > 0; j--) {
          if (i !== j) {
            if (copyInnerLayers[i].inside(runner.innerLayers[j].limit[0].start)) {
              const innerLayer = runner.innerLayers.splice(j, 1)[0];
              copyInnerLayers[i].innerLayers.push(innerLayer);
            }
          }
        }
      }
      runner = runnerCopyInnerLayers.pop();
    }

  }

  public Process() {
    this.innerLayers.sort(Layer.DefaultSort);
    const copyInnerLayers = [...this.innerLayers];
    for (let i = 0; i < copyInnerLayers.length; i++) {
      for (let j = this.innerLayers.length - 1; j > 0; j--) {
        if (i !== j) {
          if (copyInnerLayers[i].inside(this.innerLayers[j].limit[0].start)) {
            const innerLayer = this.innerLayers.splice(j, 1)[0];
            copyInnerLayers[i].innerLayers.push(innerLayer);
          }
        }
      }
    }
    for (let i = 0; i < copyInnerLayers.length; i++) {
      if (copyInnerLayers[i].innerLayers.length > 0) {
        copyInnerLayers[i].Process();
      }
    }
  }
}

class Point {
  constructor(public X: number, public Y: number, public Z: number = 1) { }

  public equals(point: Point): boolean {
    return (this.X === point.X && this.Y === point.Y && this.Z === point.Z);
  }

  public copy(): Point {
    return new Point(this.X, this.Y, this.Y);
  }

  public fromMercator(width: number, height: number): Point {
    return new Point((this.Y * (180 / height)) - 90, (this.X * (360 / width)) - 180, this.Z || 1);
  }

  public toCardian(): Point {
    return new Point(
      this.Z * Math.cos(Helper.ToRadians(this.Y)) * Math.cos(Helper.ToRadians(this.X)),
      this.Z * Math.sin(Helper.ToRadians(this.Y)) * Math.cos(Helper.ToRadians(this.X)),
      this.Z * Math.sin(Helper.ToRadians(this.X)));
  }

  public toMercator(width: number, height: number): Point {
    return new Point(Math.round((this.Y + 180) / (360 / width)), Math.round((this.X + 90) / (180 / height)), this.Z);
  }

  public toVector(transform: (n: Point) => Point = (p) => p): number[] {
    const tranformed = transform(this);
    return [tranformed.X, tranformed.Y, tranformed.Z];
  }

  public static fromCoordinate(coordinate: number[]): Point {
    return new Point(coordinate[0], coordinate[1], coordinate[2]);
  }
}

class Line {
  constructor(public start: Point, public end: Point) { }

  public get inverted(): Line {
    return new Line(this.end, this.start);
  }

  public get copy(): Line {
    return new Line(this.start, this.end);
  }

  public containsIn(array: Line[]): boolean {
    for (let i = 0; i < array.length; i++) {
      if ((array[i].start.equals(this.start)) && (array[i].end.equals(this.end))) {
        return true;
      }
    }
    return false;
  }

  public isCollinear(a: Point): boolean {
    const A = this.start.X * (this.end.Y - a.Y) + this.end.X * (a.Y - this.start.Y) + a.X * (this.start.Y - this.end.Y);
    return A === 0;
  }

  public isClockwise(vector: Line): boolean {
    const dot = (this.end.X - this.start.X) * (vector.end.X - vector.start.X) + (this.end.Y - this.start.Y) * (vector.end.Y - vector.start.Y);
    const det = (this.end.X - this.start.X) * (vector.end.Y - vector.start.Y) - (this.end.Y - this.start.Y) * (vector.end.X - vector.start.X);
    return Math.atan2(det, dot) > 0;
  }

  public equals(vector: Line): boolean {
    return (this.start.equals(vector.start) && this.end.equals(vector.end));
  }

  public static AddInIfInvertNotExistsAndRemoveItFrom(vector: Line, vectors: Line[]) {
    const vectorIdx = vectors.findIndex((v) => vector.inverted.equals(v));
    if (vectorIdx > -1) {
      vectors.splice(vectorIdx, 1);
    } else {
      vectors.push(vector);
    }
  }

  public static toPolygon(lines: Line[]): number[][] {
    const poly: number[][] = [];
    lines.forEach((line) => poly.push(line.start.toVector()));
    return poly;
  }

  public static fromPolygon(polygon: number[][]): Line[] {
    const lines: Line[] = [];
    for (let idx = 0; idx < polygon.length - 1; idx++) {
      const current = Point.fromCoordinate(polygon[idx]);
      const next = Point.fromCoordinate(polygon[idx+1]);
      lines.push(new Line(current, next));
    }
    return lines;
  }
}

class Helper {
  public static TruncDecimals(num: number, precision = 5): number {
    return Math.trunc(Math.pow(10, precision) * num) / Math.pow(10, precision);
  }

  public static ToDegrees(angle: number): number {
    return angle * (180 / Math.PI);
  }
  public static ToRadians(angle: number): number {
    return angle * (Math.PI / 180);
  }
}

class WorldInfo {
  public constructor(public topology: number, public coordinate: Point) { }

  public get Biome(): WorldBiome {
    if (this.topology < 0.35) {
      return WorldBiome.deepWater;
    } else if (this.topology < 0.50) {
      return WorldBiome.swallowWater;
    } else if (this.topology === 0.50) {
      return WorldBiome.shoreline;
    } else if (this.topology < 0.53) {
      return WorldBiome.beach;
    } else if (this.topology < 0.56) {
      return WorldBiome.sandy;
    } else if (this.topology < 0.62) {
      return WorldBiome.grass;
    } else if (this.topology < 0.70) {
      return WorldBiome.woods;
    } else if (this.topology < 0.75) {
      return WorldBiome.forest;
    } else if (this.topology < 0.80) {
      return WorldBiome.mountain;
    } else if (this.topology < 0.90) {
      return WorldBiome.snow;
    }
    return WorldBiome.grass;
  }

  public get Shoreline(): boolean {
    return this.topology === 0.50;
  }

  public static AllInOne(data: any[][]): any[] {
    const ret: any[] = [];
    data.forEach((inner) => inner.forEach(d => {
      if (d !== null) {
        ret.push(d);
      }
    }))
    return ret;
  }

  public static RemoveOne(points: WorldInfo[][], item: WorldInfo, width: number, height: number): void {
    const itemPoint = item.coordinate.toMercator(width, height);
    points[itemPoint.X].splice(itemPoint.Y, 1);
  }

  public static maxCountBiome(biomes: WorldBiome[]): string {
    const counter: { [id: string]: number } = {};
    Object.keys(WorldBiome).forEach((biome) => counter[biome] = 0);
    biomes.forEach((biome) => {
      counter[WorldBiome[biome]]++;
    });
    return Object.keys(counter)[Object.values(counter).indexOf(Math.max(...Object.values(counter)))];
  }

  public static prepareAllBiomes(): { [id: string]: Line[]; } {
    const allBiomes: { [id: string]: Line[]; } = {};
    Object.keys(WorldBiome).forEach((biome) => { if (Number.isNaN(biome)) { allBiomes[biome] = [] } });
    return allBiomes;
  }
}

class Progress {
  private progress: number;
  public step: number = 0;
  private ini: Date = new Date();
  private lastCheck: number = 0;
  constructor(private context: string, private total: number, autoStart = false, stepDiv = 20) {
    this.total = total;
    this.step = this.total / stepDiv;
    this.progress = 0;
    if (autoStart) this.start();
  }

  start() {
    this.ini = new Date();
    this.lastCheck = 0;
    console.log(`[${this.context}] start ${this.total}`, this.ini);
  }

  stop() {
    const end = new Date();
    const check = Helper.TruncDecimals(end.getTime() / 1000 - this.ini.getTime() / 1000, 3);
    console.log(`[${this.context}] last: ${Helper.TruncDecimals(check - this.lastCheck, 3)}s duration: ${check}s ${end}`);
  }

  check(msg: string = '') {
    this.progress++;
    if (this.progress % this.step === 0) {
      const partial = new Date();
      if (this.ini !== null) {
        const check = Helper.TruncDecimals(partial.getTime() / 1000 - this.ini.getTime() / 1000, 3);
        console.log(`[${this.context}] ${Math.round((this.progress * 100) / this.total)}% check: ${Helper.TruncDecimals(check - this.lastCheck, 3)}s ${check}s {${msg}}`);
        this.lastCheck = check;
      }
    }
  }
}

class PseudoRandom {
  constructor(public seed: number, private _divergent = 0) { }
  public get random(): number {
    let copy = (this.seed + this._divergent++).valueOf();
    copy = ((copy + 0x7ED55D16) + (copy << 12)) & 0xFFFFFFFF;
    copy = ((copy ^ 0xC761C23C) ^ (copy >>> 19)) & 0xFFFFFFFF;
    copy = ((copy + 0x165667B1) + (copy << 5)) & 0xFFFFFFFF;
    copy = ((copy + 0xD3A2646C) ^ (copy << 9)) & 0xFFFFFFFF;
    copy = ((copy + 0xFD7046C5) + (copy << 3)) & 0xFFFFFFFF;
    copy = ((copy ^ 0xB55A4F09) ^ (copy >>> 16)) & 0xFFFFFFFF;
    return (copy & 0xFFFFFFF) / 0x10000000;
  }
}

enum WorldBiome {
  deepWater,
  swallowWater,
  shoreline,
  beach,
  sandy,
  grass,
  woods,
  forest,
  mountain,
  snow
}

class Perlin {
  private static perlin(x: number, y: number, z: number, p: number[]) {
    const X = Math.floor(x) & 255,
      Y = Math.floor(y) & 255,
      Z = Math.floor(z) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);
    const u = this.fade(x),
      v = this.fade(y),
      w = this.fade(z);
    const A = p[X] + Y, AA = p[A] + Z, AB = p[A + 1] + Z,
      B = p[X + 1] + Y, BA = p[B] + Z, BB = p[B + 1] + Z;

    return this.lerp(w, this.lerp(v, this.lerp(u, this.grad(p[AA], x, y, z),
      this.grad(p[BA], x - 1, y, z)),
      this.lerp(u, this.grad(p[AB], x, y - 1, z),
        this.grad(p[BB], x - 1, y - 1, z))),
      this.lerp(v, this.lerp(u, this.grad(p[AA + 1], x, y, z - 1),
        this.grad(p[BA + 1], x - 1, y, z - 1)),
        this.lerp(u, this.grad(p[AB + 1], x, y - 1, z - 1),
          this.grad(p[BB + 1], x - 1, y - 1, z - 1))));
  }
  private static fade(t: number) { return t * t * t * (t * (t * 6 - 15) + 10); }
  private static lerp(t: number, a: number, b: number) { return a + t * (b - a); }
  private static grad(hash: number, x: number, y: number, z: number) {
    const h = hash & 15;
    const u = h < 8 ? x : y,
      v = h < 4 ? y : h == 12 || h == 14 ? x : z;
    return ((h & 1) == 0 ? u : -u) + ((h & 2) == 0 ? v : -v);
  };

  private static octaves(x: number, y: number, z: number, p: number[], persistence = 0.5, octaves = 6) {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;
    for (let i = 0; i < octaves; i++) {
      total += this.perlin(x * frequency, y * frequency, z * frequency, p) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }
    return total / maxValue;
  }

  public static readonly DefaultP = [151, 160, 137, 91, 90, 15,
    131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23,
    190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33,
    88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166,
    77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244,
    102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196,
    135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123,
    5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42,
    223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9,
    129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228,
    251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107,
    49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254,
    138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180];

  public static get RandomP(): number[] {
    const array = new Uint8Array(256);
    window.crypto.getRandomValues(array);
    const list: number[] = [];
    array.forEach((v) => list.push(v));
    return list;
  }

  public static Noise(point: Point, factor = 1, p: number[], persistence = 0.5, octaves = 6) {
    return this.octaves(point.X / factor, point.Y / factor, point.Z / factor, p, persistence, octaves);
  }
}

export class WorldBuilder {
  private noise: { raw: number[], topology: number[] } = { raw: [], topology: [] };
  private pseudo: PseudoRandom;
  constructor(public seed = 8, useDefault = true, public tiltInDegree = 23.43, public oceanLevel = 0.5, public rotationSpeedInHours = 24, public numLatitudes = 12, public radius = 5000) {
    this.prepareSeed(this.seed);
    this.noise.raw = useDefault ? Perlin.DefaultP : Perlin.RandomP;
    this.noise.topology = this.generateNoise(this.noise.raw, this.seed);
    this.pseudo = new PseudoRandom(this.seed);
  }

  private prepareSeed(seed: number) {
    if (seed > 0 && seed < 1) {
      seed *= 65536;
    }
    seed = Math.floor(seed);
    if (seed < 256) {
      seed |= seed << 8;
    }
  }

  private generateNoise(array: number[], seed: number) {
    const data = [];
    for (let i = 0; i < 256; i++) {
      if (i & 1) {
        data[i] = data[i + 256] = array[i] ^ (seed & 255);
      }
      else {
        data[i] = data[i + 256] = array[i] ^ ((seed >> 8) & 255);
      }
    }
    return data;
  }

  public GetInformation(coordinate: Point): WorldInfo {
    if (coordinate.Z === null) {
      coordinate.Z = 1;
    }
    var point = coordinate.toCardian();
    const topology = Math.trunc((Perlin.Noise(point, coordinate.Z, this.noise.topology, 0.68) + 0.5) * 100) / 100;
    return new WorldInfo(topology, coordinate);
  }

  public getLayers(numPoints: number): Promise<GeoJson> { //{ [id: string]: string; }
    const progress = new Progress('getLayers', numPoints);
    return new Promise<GeoJson>(resolve => {
      progress.start();
      const allLayers: { [id: string]: Line[]; } = WorldInfo.prepareAllBiomes();
      const points = this.getPoints(numPoints);
      const voronoi = this.getVoronoi(points);
      // const axisX: number[] = [];
      // const axisY: number[] = [];
      // points.forEach((point) => {
      //   const currentX = point[0];
      //   const currentY = point[1];
      //   if (!axisX.includes(currentX)) axisX.push(currentX);
      //   if (!axisY.includes(currentY)) axisY.push(currentY);
      // });
      // axisX.sort((a,b)=>a-b);
      // axisY.sort((a,b)=>a-b);
      // console.log('points', points.length, axisX, axisY, axisX.length * axisY.length);

      console.log(`voronoi`, voronoi);

      for (let idxV = 0; idxV < voronoi.features.length; idxV++) {
        const feature = voronoi.features[idxV];
        const lines = Line.fromPolygon(<number[][]>feature.geometry.coordinates[0]);
        const biome = WorldBiome[this.GetInformation(Point.fromCoordinate(<number[]>feature.properties['site'])).Biome];
        if (allLayers[biome] === undefined) allLayers[biome] = [];
        for (let idxL = 0; idxL < lines.length; idxL++) {
          const line = lines[idxL];
          Line.AddInIfInvertNotExistsAndRemoveItFrom(line, allLayers[biome]);
        }
        progress.check(`idxV:${idxV} lines:${lines.length} biome:${biome} polygon:${allLayers[biome].length}`);
      }

      console.log('allLayers', allLayers);
      // const pointsUseds: Point[] = [];

      // //axisX.forEach((x: number, idx: number) => {
      // for (let x = 0; x < width - 1; x++) {
      //   //axisY.forEach((y: number, idy: number) => {
      //   for (let y = 0; y < height - 1; y++) {
      //     // const no = new Point(x, y, 0),
      //     //   ne = new Point(1 + x, y, 0),
      //     //   so = new Point(x, 1 + y, 0),
      //     //   se = new Point(1 + x, 1 + y, 0);

      //     // var square = [new Line(no, ne), new Line(ne, se), new Line(se, so), new Line(so, no)];

      //     // var biomes = square.map((line) => {
      //     //   const actualPoint = line.start.fromMercator(width, height);
      //     //   pointsUseds.push(actualPoint.copy());
      //     //   return this.GetInformation(actualPoint).Biome;
      //     // });

      //     // if (biomes[0] === biomes[1] && biomes[2] === biomes[3] && biomes[0] === biomes[3]) {
      //     //   square.forEach((vector) => Line.AddInIfInvertNotExistsAndRemoveItFrom(vector, allLayers[WorldBiome[biomes[0]]]));
      //     // } else {
      //     //   square.forEach((vector) => Line.AddInIfInvertNotExistsAndRemoveItFrom(vector, allLayers[WorldInfo.maxCountBiome(biomes)]));
      //     // }

      //     progress.check();
      //   }//)
      // }//)
      const layers: { [id: string]: GeoJsonFeature; } = {};
      Object.keys(allLayers).forEach((layerName: string) => {
        if (allLayers[layerName].length > 0)
          layers[layerName] = Layer.Generate(layerName, allLayers[layerName]).AsGeoJsonFeature();
      });

      console.log('layers', layers);

      const geoJson = new GeoJson(Object.values(layers));
      console.log(`geoJson`, geoJson);

      // const layersAsSvg: { [id: string]: string; } = {};

      // Object.keys(layers).forEach((layerName: string) => {
      //   layersAsSvg[layerName] = layers[layerName].AsSvgPath();
      // });

      //resolve(layersAsSvg);

      resolve(geoJson);
      progress.stop();
    });
  }

  public getPoints(siteSize: number = 18): number[][] {
    const points: number[][] = [];
    d3.range(0, siteSize ?? 18).forEach((_: number) => {
      points.push([
        360 * this.pseudo.random - 180,
        180 * this.pseudo.random - 90
      ]);
    });
    return points;
  }

  public getVoronoi(points: number[][]) {
    const voronoi: GeoJson = d3V.geoVoronoi()
      .x((p: number[]) => +p[0])
      .y((p: number[]) => +p[1])
      (points).polygons();
    return voronoi;
  }
}
