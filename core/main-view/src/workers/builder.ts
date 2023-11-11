import * as d3 from "d3";
import * as d3V from 'd3-geo-voronoi';
import { GeoJson, GeoJsonFeature, GeoJsonPolygon } from "../models/geojson";
import PseudoRandom from "../tools/pseudo-random";
import Progress from "../tools/progress";
import Perlin from "../tools/perlin";



// class Point {
//   constructor(public X: number, public Y: number, public Z: number = 1) { }

//   // public equals(point: Point): boolean {
//   //   return (this.X === point.X && this.Y === point.Y && this.Z === point.Z);
//   // }

//   // public copy(): Point {
//   //   return new Point(this.X, this.Y, this.Y);
//   // }

//   // public fromMercator(width: number, height: number): Point {
//   //   return new Point((this.Y * (180 / height)) - 90, (this.X * (360 / width)) - 180, this.Z || 1);
//   // }

//   public toCardian(): Point {
//     return new Point(
//       this.Z * Math.cos(Helper.ToRadians(this.X)) * Math.cos(Helper.ToRadians(this.Y)),
//       this.Z * Math.sin(Helper.ToRadians(this.X)) * Math.cos(Helper.ToRadians(this.Y)),
//       this.Z * Math.sin(Helper.ToRadians(this.Y)));
//   }

//   // public toMercator(width: number, height: number): Point {
//   //   return new Point(Math.round((this.Y + 180) / (360 / width)), Math.round((this.X + 90) / (180 / height)), this.Z);
//   // }

//   // public toVector(transform: (n: Point) => Point = (p) => p): number[] {
//   //   const tranformed = transform(this);
//   //   return [tranformed.X, tranformed.Y, tranformed.Z];
//   // }

//   public static fromCoordinate(coordinate: number[]): Point {
//     return new Point(coordinate[0], coordinate[1], coordinate[2]);
//   }
// }

// class Line {
//   constructor(public start: Point, public end: Point) { }

//   public get inverted(): Line {
//     return new Line(this.end, this.start);
//   }

//   public get copy(): Line {
//     return new Line(this.start, this.end);
//   }

//   public containsIn(array: Line[]): boolean {
//     for (let i = 0; i < array.length; i++) {
//       if ((array[i].start.equals(this.start)) && (array[i].end.equals(this.end))) {
//         return true;
//       }
//     }
//     return false;
//   }

//   public isCollinear(a: Point): boolean {
//     const A = this.start.X * (this.end.Y - a.Y) + this.end.X * (a.Y - this.start.Y) + a.X * (this.start.Y - this.end.Y);
//     return A === 0;
//   }

//   public isClockwise(vector: Line): boolean {
//     const dot = (this.end.X - this.start.X) * (vector.end.X - vector.start.X) + (this.end.Y - this.start.Y) * (vector.end.Y - vector.start.Y);
//     const det = (this.end.X - this.start.X) * (vector.end.Y - vector.start.Y) - (this.end.Y - this.start.Y) * (vector.end.X - vector.start.X);
//     return Math.atan2(det, dot) > 0;
//   }

//   public equals(vector: Line): boolean {
//     return (this.start.equals(vector.start) && this.end.equals(vector.end));
//   }

//   public static AddInIfInvertNotExistsAndRemoveItFrom(vector: Line, vectors: Line[]) {
//     const vectorIdx = vectors.findIndex((v) => vector.inverted.equals(v));
//     if (vectorIdx > -1) {
//       vectors.splice(vectorIdx, 1);
//     } else {
//       vectors.push(vector);
//     }
//   }

//   public static toPolygon(lines: Line[]): number[][] {
//     const poly: number[][] = [];
//     lines.forEach((line) => poly.push(line.start.toVector()));
//     return poly;
//   }

//   public static fromPolygon(polygon: number[][]): Line[] {
//     const lines: Line[] = [];
//     for (let idx = 0; idx < polygon.length - 1; idx++) {
//       const current = Point.fromCoordinate(polygon[idx]);
//       const next = Point.fromCoordinate(polygon[idx + 1]);
//       lines.push(new Line(current, next));
//     }
//     return lines;
//   }
// }

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

// class WorldInfo {
//   public constructor(public topology: number, public coordinate: Point) { }

//   public get Biome(): WorldBiome {
//     if (this.topology < 0.35) {
//       return WorldBiome.deepWater;
//     } else if (this.topology < 0.50) {
//       return WorldBiome.swallowWater;
//     } else if (this.topology === 0.50) {
//       return WorldBiome.shoreline;
//     } else if (this.topology < 0.53) {
//       return WorldBiome.beach;
//     } else if (this.topology < 0.56) {
//       return WorldBiome.sandy;
//     } else if (this.topology < 0.62) {
//       return WorldBiome.grass;
//     } else if (this.topology < 0.70) {
//       return WorldBiome.woods;
//     } else if (this.topology < 0.75) {
//       return WorldBiome.forest;
//     } else if (this.topology < 0.80) {
//       return WorldBiome.mountain;
//     } else if (this.topology < 0.90) {
//       return WorldBiome.snow;
//     }
//     return WorldBiome.grass;
//   }

//   public get Shoreline(): boolean {
//     return this.topology === 0.50;
//   }

//   public static AllInOne(data: any[][]): any[] {
//     const ret: any[] = [];
//     data.forEach((inner) => inner.forEach(d => {
//       if (d !== null) {
//         ret.push(d);
//       }
//     }))
//     return ret;
//   }

//   // public static RemoveOne(points: WorldInfo[][], item: WorldInfo, width: number, height: number): void {
//   //   const itemPoint = item.coordinate.toMercator(width, height);
//   //   points[itemPoint.X].splice(itemPoint.Y, 1);
//   // }

//   public static maxCountBiome(biomes: WorldBiome[]): string {
//     const counter: { [id: string]: number } = {};
//     Object.keys(WorldBiome).forEach((biome) => counter[biome] = 0);
//     biomes.forEach((biome) => {
//       counter[WorldBiome[biome]]++;
//     });
//     return Object.keys(counter)[Object.values(counter).indexOf(Math.max(...Object.values(counter)))];
//   }

//   // public static prepareAllBiomes(): { [id: string]: Line[]; } {
//   //   const allBiomes: { [id: string]: Line[]; } = {};
//   //   Object.keys(WorldBiome).forEach((biome) => { if (Number.isNaN(biome)) { allBiomes[biome] = [] } });
//   //   return allBiomes;
//   // }
// }

// class Progress {
//   private progress: number;
//   public step: number = 0;
//   private ini: Date = new Date();
//   private lastCheck: number = 0;
//   constructor(private context: string, private total: number, autoStart = false, stepDiv = 20) {
//     this.total = total;
//     this.step = this.total / stepDiv;
//     this.progress = 0;
//     if (autoStart) this.start();
//   }

//   start(newTotal = -1, newContext = '', newStepDiv = 20) {
//     this.lastCheck = 0;
//     this.progress = 0;
//     if (newTotal !== -1) this.total = newTotal;
//     this.step = this.total / newStepDiv;
//     if (newContext !== '') this.context = newContext;

//     this.ini = new Date();

//     console.log(`[${this.context}] start ${this.total}`, this.ini);
//   }

//   stop() {
//     const end = new Date();
//     const check = Helper.TruncDecimals(end.getTime() / 1000 - this.ini.getTime() / 1000, 3);
//     console.log(`[${this.context}] last: ${Helper.TruncDecimals(check - this.lastCheck, 3)}s duration: ${check}s ${end}`);
//   }

//   check(msg: string = '') {
//     this.progress++;
//     if (this.progress % this.step === 0) {
//       const partial = new Date();
//       if (this.ini !== null) {
//         const check = Helper.TruncDecimals(partial.getTime() / 1000 - this.ini.getTime() / 1000, 3);
//         console.log(`[${this.context}] ${Math.round((this.progress * 100) / this.total)}% check: ${Helper.TruncDecimals(check - this.lastCheck, 3)}s ${check}s {${msg}}`);
//         this.lastCheck = check;
//       }
//     }
//   }
// }

// class PseudoRandom {
//   constructor(public seed: number, private _divergent = 0) { }
//   public get random(): number {
//     let copy = (this.seed + this._divergent++).valueOf();
//     copy = ((copy + 0x7ED55D16) + (copy << 12)) & 0xFFFFFFFF;
//     copy = ((copy ^ 0xC761C23C) ^ (copy >>> 19)) & 0xFFFFFFFF;
//     copy = ((copy + 0x165667B1) + (copy << 5)) & 0xFFFFFFFF;
//     copy = ((copy + 0xD3A2646C) ^ (copy << 9)) & 0xFFFFFFFF;
//     copy = ((copy + 0xFD7046C5) + (copy << 3)) & 0xFFFFFFFF;
//     copy = ((copy ^ 0xB55A4F09) ^ (copy >>> 16)) & 0xFFFFFFFF;
//     return (copy & 0xFFFFFFF) / 0x10000000;
//   }
// }

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

// class Perlin {
//   private static perlin(x: number, y: number, z: number, p: number[]) {
//     const X = Math.floor(x) & 255,
//       Y = Math.floor(y) & 255,
//       Z = Math.floor(z) & 255;
//     x -= Math.floor(x);
//     y -= Math.floor(y);
//     z -= Math.floor(z);
//     const u = this.fade(x),
//       v = this.fade(y),
//       w = this.fade(z);
//     const A = p[X] + Y, AA = p[A] + Z, AB = p[A + 1] + Z,
//       B = p[X + 1] + Y, BA = p[B] + Z, BB = p[B + 1] + Z;

//     return this.lerp(w,
//       this.lerp(v,
//         this.lerp(u,
//           this.grad(p[AA], x, y, z),
//           this.grad(p[BA], x - 1, y, z)),
//         this.lerp(u,
//           this.grad(p[AB], x, y - 1, z),
//           this.grad(p[BB], x - 1, y - 1, z))),
//       this.lerp(v,
//         this.lerp(u,
//           this.grad(p[AA + 1], x, y, z - 1),
//           this.grad(p[BA + 1], x - 1, y, z - 1)),
//         this.lerp(u,
//           this.grad(p[AB + 1], x, y - 1, z - 1),
//           this.grad(p[BB + 1], x - 1, y - 1, z - 1))));
//   }
//   private static fade(t: number) { return t * t * t * (t * (t * 6 - 15) + 10); }
//   private static lerp(t: number, a: number, b: number) { return a + t * (b - a); }
//   private static grad(hash: number, x: number, y: number, z: number) {
//     const h = hash & 15;
//     const u = h < 8 ? x : y,
//       v = h < 4 ? y : h == 12 || h == 14 ? x : z;
//     return ((h & 1) == 0 ? u : -u) + ((h & 2) == 0 ? v : -v);
//   };

//   private static octaves(x: number, y: number, z: number, p: number[], persistence = 0.5, octaves = 6) {
//     let total = 0;
//     let frequency = 1;
//     let amplitude = 1;
//     let maxValue = 0;
//     for (let i = 0; i < octaves; i++) {
//       total += this.perlin(x * frequency, y * frequency, z * frequency, p) * amplitude;
//       maxValue += amplitude;
//       amplitude *= persistence;
//       frequency *= 2;
//     }
//     return total / maxValue;
//   }

//   public static readonly DefaultP = [151, 160, 137, 91, 90, 15,
//     131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23,
//     190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33,
//     88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166,
//     77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244,
//     102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196,
//     135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123,
//     5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42,
//     223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9,
//     129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228,
//     251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107,
//     49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254,
//     138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180];

//   public static get RandomP(): number[] {
//     const array = new Uint8Array(256);
//     window.crypto.getRandomValues(array);
//     const list: number[] = [];
//     array.forEach((v) => list.push(v));
//     return list;
//   }

//   public static Noise(point: number[], factor = 1, p: number[], persistence = 0.5, octaves = 6) {
//     return this.octaves(point[0] / factor, point[1] / factor, point[2] / factor, p, persistence, octaves);
//   }
// }

// class Perlin4D {
//   private static perlin(x: number, y: number, z: number, t: number, p: number[]) {
//     const X = Math.floor(x) & 255,
//       Y = Math.floor(y) & 255,
//       Z = Math.floor(z) & 255,
//       T = Math.floor(t) & 255;
//     x -= Math.floor(x);
//     y -= Math.floor(y);
//     z -= Math.floor(z);
//     t -= Math.floor(t);
//     const u = this.fade(x),
//       v = this.fade(y),
//       w = this.fade(z),
//       s = this.fade(t);
//     const A = p[X] + Y, AA = p[A] + Z, AB = p[A + 1] + Z,
//       B = p[X + 1] + Y, BA = p[B] + Z, BB = p[B + 1] + Z;

//     return this.lerp(s, 
//       this.lerp(w, 
//         this.lerp(v, 
//           this.lerp(u, 
//             this.grad(p[AA], x, y, z, t), 
//             this.grad(p[BA], x - 1, y, z, t)), 
//           this.lerp(u, 
//             this.grad(p[AB], x, y - 1, z, t), 
//             this.grad(p[BB], x - 1, y - 1, z, t))), 
//         this.lerp(v, 
//           this.lerp(u, 
//             this.grad(p[AA + 1], x, y, z - 1, t), 
//             this.grad(p[BA + 1 + T], x - 1, y, z - 1, t)), 
//           this.lerp(u, 
//             this.grad(p[AB + 1], x, y - 1, z - 1, t), 
//             this.grad(p[BB + 1], x - 1, y - 1, z - 1, t)))),
//       this.lerp(w, 
//         this.lerp(v, 
//           this.lerp(u, 
//             this.grad(p[AA + T], x, y, z, t), 
//             this.grad(p[BA + T], x - 1, y, z, t)), 
//           this.lerp(u, 
//             this.grad(p[AB + T], x, y - 1, z, t), 
//             this.grad(p[BB + T], x - 1, y - 1, z, t))), 
//         this.lerp(v, 
//           this.lerp(u, 
//             this.grad(p[AA + 1 + T], x, y, z - 1, t), 
//             this.grad(p[BA + 1 + T], x - 1, y, z - 1, t)), 
//           this.lerp(u, 
//             this.grad(p[AB + 1 + T], x, y - 1, z - 1, t), 
//             this.grad(p[BB + 1 + T], x - 1, y - 1, z - 1, t)))));
//   }

//   private static fade(t: number) { return t * t * t * (t * (t * 6 - 15) + 10); }
//   private static lerp(t: number, a: number, b: number) { return a + t * (b - a); }
//   private static grad(hash: number, x: number, y: number, z: number, t: number) {
//     const h = hash & 31;
//     const u = h < 24 ? x : y,
//       v = h < 16 ? y : h < 24 ? z : t;
//     return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
//   }

//   private static octaves(x: number, y: number, z: number, t: number, p: number[], persistence = 0.5, octaves = 6) {
//     let total = 0;
//     let frequency = 1;
//     let amplitude = 1;
//     let maxValue = 0;
//     for (let i = 0; i < octaves; i++) {
//       total += this.perlin(x * frequency, y * frequency, z * frequency, t * frequency, p) * amplitude;
//       maxValue += amplitude;
//       amplitude *= persistence;
//       frequency *= 2;
//     }
//     return total / maxValue;
//   }

//   public static readonly DefaultP = [151, 160, 137, 91, 90, 15,
//     131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23,
//     190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33,
//     88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166,
//     77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244,
//     102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196,
//     135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123,
//     5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42,
//     223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9,
//     129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228,
//     251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107,
//     49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254,
//     138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180];

//   public static get RandomP(): number[] {
//     const array = new Uint8Array(256);
//     window.crypto.getRandomValues(array);
//     const list: number[] = [];
//     array.forEach((v) => list.push(v));
//     return list;
//   }

//   public static Noise(point: [number, number, number, number], factor = 1, p: number[], persistence = 0.5, octaves = 6) {
//     return this.octaves(point[0] / factor, point[1] / factor, point[2] / factor, point[3] / factor, p, persistence, octaves);
//   }
// }

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

  public getInformation(_point: number[]): number {
    class point {
      constructor(public X: number, public Y: number, public Z: number = 1) { }
    
      public toCardian(): point {
        return new point(
          this.Z * Math.cos(Helper.ToRadians(this.X)) * Math.cos(Helper.ToRadians(this.Y)),
          this.Z * Math.sin(Helper.ToRadians(this.X)) * Math.cos(Helper.ToRadians(this.Y)),
          this.Z * Math.sin(Helper.ToRadians(this.Y)));
      }
    }
    if (_point[2] === null) {
      _point[2] = 1;
    }
    // const point = new Point(
    //   _point[2] * Math.cos(Helper.ToRadians(_point[0])) * Math.cos(Helper.ToRadians(_point[1])),
    //   _point[2] * Math.sin(Helper.ToRadians(_point[0])) * Math.cos(Helper.ToRadians(_point[1])),
    //   _point[2] * Math.sin(Helper.ToRadians(_point[1]))
    // );
    const p = new point(_point[0], _point[1], _point[2]).toCardian();
    const topology = Math.trunc((Perlin.Noise([p.X, p.Y, p.Z], _point[2], this.noise.topology, 0.68) + 0.5) * 100) / 100;
    return topology;
  }

  public getLayers(numPoints: number, numPlates: number = 10, plateMaxSize: number = 42, perlinFactor: number = 1 / 2, numPlateCellsInter: number = 5): Promise<GeoJson> {
    let progress = new Progress('getLayers', numPoints);
    return new Promise<GeoJson>(resolve => {
      progress.start();
      const cells = this.getVoronoi(this.getPoints(numPoints));
      const plates = this.getVoronoi(this.getPoints(numPlates));

      console.log(`voronoi`, cells);

      plates.features.forEach((plate, idx) => {
        const plate_size = plateMaxSize * this.pseudo.random;
        plate.properties['idx'] = idx;
        plate.properties['plate_size'] = plate_size;
      });
      console.log(`plates`, plates);

      const biomesGrouped: { [id: string]: GeoJsonFeature[]; } = {};
      const borderCells: { [id: string]: GeoJsonFeature[]; } = {};

      cells.features.forEach((feature, idx) => {
        const site = <number[]>feature.properties['site'];
        const perlin = this.getInformation(site);
        const plate_idx = GeoJson.GetFeatureIdxThatContainsPoint(plates, site);
        const between_plates = GeoJson.GetFeatureIdxThatContainsPoints(plates, <number[][]>feature.geometry.coordinates[0]);
        const site_plate = <number[]>plates.features[plate_idx].properties['site'];
        const plate_size = <number>plates.features[plate_idx].properties['plate_size'];

        const distance = this.distance(site, site_plate);
        let elevation = perlin * perlinFactor + this.elevation(distance, plate_size);

        let biome = WorldBiome[this.getBiome(elevation)];
        let cssclass = biome;

        if (between_plates.length > 1) {
          cssclass = 'border';

          let elevationAverage = elevation;
          between_plates.forEach((pidx) => {
            if (pidx !== plate_idx) {
              const psite = <number[]>plates.features[plate_idx].properties['site'];
              const pdistance = this.distance(psite, site_plate);
              const pperlin = this.getInformation(psite);
              elevationAverage += pperlin * perlinFactor + this.elevation(pdistance, plate_size);
            }
          });
          elevationAverage /= between_plates.length;

          elevation = elevationAverage;
          biome = WorldBiome[this.getBiome(elevation)];

          if (borderCells[cssclass] === undefined) borderCells[cssclass] = [];
          borderCells[cssclass].push(feature);
        }

        let plate_cells = plates.features[plate_idx].properties['cells'] as number[];
        if (plate_cells === undefined) plate_cells = [];
        plate_cells.push(idx);
        plates.features[plate_idx].properties['cells'] = plate_cells;

        feature.properties['idx'] = idx;
        feature.properties['biome'] = biome;
        feature.properties['cssclass'] = cssclass;
        feature.properties['perlin'] = perlin;
        feature.properties['plate'] = plate_idx;
        feature.properties['between_plates'] = between_plates;
        feature.properties['plate_size'] = plate_size;
        feature.properties['elevation'] = elevation;

        if (biomesGrouped[biome] === undefined) biomesGrouped[biome] = [];
        biomesGrouped[biome].push(feature);

        progress.check(`idx:${idx} biome:${biome}`);
      });
      progress.stop();

      // if (numPlateCellsInter > 0)
      //   this.processNeighbours(cells, biomesGrouped, borderCells, numPlateCellsInter);

      progress.start(Object.keys(biomesGrouped).length, 'pos processing');
      console.log(`biomesGrouped`, biomesGrouped, Object.keys(borderCells));

      // console.log('check merge', Object.keys(biomesGrouped)[0], biomesGrouped[Object.keys(biomesGrouped)[0]][0], biomesGrouped[Object.keys(biomesGrouped)[0]], GeoJsonFeature.MergePolygon(biomesGrouped[Object.keys(biomesGrouped)[0]][0], biomesGrouped[Object.keys(biomesGrouped)[0]], { 'biome': Object.keys(biomesGrouped)[0] }));

      // const biomesMerged: { [id: string]: GeoJsonFeature; } = {};
      // Object.keys(biomesGrouped).forEach((biome) => {
      //   biomesMerged[biome] = biomesGrouped[biome][0];
      //   for (let i = 1; i < biomesGrouped[biome].length; i++) {
      //     biomesMerged[biome] = this.mergeGeoJsonFeature(biomesMerged[biome], biomesGrouped[biome][i], { 'biome': biome });
      //   }
      // })

      // console.log(`biomesMerged`, biomesMerged);

      // const geojson = new GeoJson(Object.values(biomesMerged));

      // console.log(`geojson`, geojson)

      resolve(cells);
      progress.stop();
    });
  }

  public rotateLeftPolygon(polygon: number[][]): number[][] {
    const ret: number[][] = [...polygon];
    ret.shift();
    ret.push(ret[0]);
    return ret;
  }

  public rotateRightPolygon(polygon: number[][]): number[][] {
    const ret: number[][] = [...polygon];
    ret.pop(); // remove duplicated
    const last = ret.pop();
    if (last !== undefined)
      ret.unshift(last);
    return ret;
  }

  public processNeighbours(cells: GeoJson, biomesGrouped: { [id: string]: GeoJsonFeature[]; }, borderCells: { [id: string]: GeoJsonFeature[]; }, num_process = 5, alias = 'neighbour', ini_exclude = ['border']) {
    const exclude = ini_exclude;
    for (let c = 1; c <= num_process; c++) {
      borderCells[`${alias}${c}`] = this.processNeighbour(alias, c, cells.features, biomesGrouped, <GeoJsonFeature[]>borderCells[exclude[exclude.length - 1]], exclude, num_process, 1 / num_process);
      exclude.push(`${alias}${c}`);
    }
  }

  private processNeighbour(alias: string, alias_idx: number, cells: GeoJsonFeature[], biomesGrouped: { [id: string]: GeoJsonFeature[]; }, border_cells: GeoJsonFeature[], exclude_alias: string[], total: number, percente: number): GeoJsonFeature[] {
    let progress = new Progress(`processNeighbour ${alias} ${alias_idx}`, border_cells.length);
    const ret: GeoJsonFeature[] = [];
    progress.start();
    border_cells.forEach((feature) => {
      const idx = <number>feature.properties['idx'];
      const plateIdx = <number>feature.properties['plate'];
      const neighboursIdxs = <number[]>feature.properties['neighbours'];
      neighboursIdxs.forEach((neighbourIdx) => {
        const neighbour = cells[neighbourIdx];
        const neighbour_plateIdx = <number>neighbour.properties['plate'];
        if (idx !== <number>neighbour.properties['idx']) {
          if (!(exclude_alias.includes(<string>neighbour.properties['cssclass']))) {
            if (plateIdx === neighbour_plateIdx) {
              const ref_elevation = <number>feature.properties['elevation'];
              neighbour.properties['elevation'] = ((<number>neighbour.properties['elevation']) * (alias_idx * percente)) + (ref_elevation * ((total - alias_idx) * percente));

              const old_biome = neighbour.properties['biome'];
              const old_pos = biomesGrouped[old_biome].findIndex((feature) => (<number>feature.properties['idx']) === neighbourIdx);
              biomesGrouped[old_biome].splice(old_pos, 1);
              const new_biome = WorldBiome[this.getBiome(<number>neighbour.properties['elevation'])];
              if (biomesGrouped[new_biome] === undefined) biomesGrouped[new_biome] = [];
              biomesGrouped[new_biome].push(neighbour);

              neighbour.properties['biome'] = new_biome;
              neighbour.properties[alias] = alias_idx;
              neighbour.properties['cssclass'] = alias + alias_idx;
              ret.push(neighbour);
            }
          }
        }
      });
      progress.check(`idx:${idx} `);
    });
    progress.stop();
    return ret;
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

  private distance(pointA: number[], pointB: number[]): number {
    const cathetiA = pointA[0] - pointB[0];
    const cathetiB = pointA[1] - pointB[1];
    const cathetiC = pointA.length > 2 && pointB.length > 2 ? pointA[1] - pointB[1] : 0;
    return Math.trunc(Math.sqrt(cathetiA ** 2 + cathetiB ** 2 + cathetiC ** 2));
  }

  public elevation(distanceToCenter: number, widthFactor: number): number {
    const amplitude = 0.5;
    const elevationValue = amplitude * Math.exp(-((distanceToCenter ** 2) / (2 * widthFactor ** 2)));

    return elevationValue;
  }

  public getBiome(topology: number): WorldBiome {
    if (topology < 0.35) {
      return WorldBiome.deepWater;
    } else if (topology < 0.50) {
      return WorldBiome.swallowWater;
    } else if (topology === 0.50) {
      return WorldBiome.shoreline;
    } else if (topology < 0.53) {
      return WorldBiome.beach;
    } else if (topology < 0.56) {
      return WorldBiome.sandy;
    } else if (topology < 0.62) {
      return WorldBiome.grass;
    } else if (topology < 0.70) {
      return WorldBiome.woods;
    } else if (topology < 0.75) {
      return WorldBiome.forest;
    } else if (topology < 0.80) {
      return WorldBiome.mountain;
    } else if (topology < 0.90) {
      return WorldBiome.snow;
    }
    return WorldBiome.grass;
  }

  public canMergeGeoJsonFeature(g1: GeoJsonFeature, g2: GeoJsonFeature): boolean {
    const g1Coordinates = (g1.geometry.coordinates as number[][][])[0];
    const g2Coordinates = (g2.geometry.coordinates as number[][][])[0];

    return this.canMergePolygons(g1Coordinates, g2Coordinates).found;
  }

  public mergeGeoJsonFeature(g1: GeoJsonFeature, g2: GeoJsonFeature, newProps: { [id: string]: any; } = {}): GeoJsonFeature {
    const g1Coordinates = (g1.geometry.coordinates as number[][][])[0];
    const g2Coordinates = (g2.geometry.coordinates as number[][][])[0];
    const mergedCoordinates = this.mergePolygons(g1Coordinates, g2Coordinates);
    const newGeometry: GeoJsonPolygon = new GeoJsonPolygon([mergedCoordinates]);
    return new GeoJsonFeature(newGeometry, newProps);
  }

  public canMergePolygons(probe_coordinates: number[][], neighbour_coordinates: number[][]): { idxI: number, idxC: number, found: boolean } {
    let found = false;
    let idxI = -1;
    let idxC = -1;

    for (let i = 0; i < probe_coordinates.length; i++) {
      for (let c = 0; c < neighbour_coordinates.length; c++) {
        if (probe_coordinates[i][0] === neighbour_coordinates[c][0] && probe_coordinates[i][1] === neighbour_coordinates[c][1]) {
          idxI = i;
          idxC = c;
          found = true;
          break;
        }
      }
      if (found) break;
    }
    console.log(`found: ${found}`)
    return { idxI: idxI, idxC: idxC, found: found };
  }

  public processCells(cells: GeoJson): GeoJson {
    const cells_copy = [...cells.features];
    let circutBreak = cells_copy.length;
    //while (cells_copy.length > 0 || circutBreak > 0) {
    const probe = cells_copy[5415];
    if (probe !== undefined) //break;
    {
      const neighboursIdxs = <number[]>probe?.properties['neighbours'];
      const neighbours = cells_copy.filter((c) => neighboursIdxs.includes(c.properties['idx']) && c.properties['biome'] === probe.properties['biome']);

      const probe_coordinates = <number[][]>probe.geometry.coordinates[0];
      const neighbour_coordinates = <number[][]>neighbours[0].geometry.coordinates[0];

      const mergedCoordinates: number[][] = this.mergePolygons(probe_coordinates, neighbour_coordinates);

      console.log(`merge`, probe_coordinates, neighbour_coordinates, mergedCoordinates);

      //   circutBreak--;
    }

    return new GeoJson([]);
  }

  public mergePolygons(probe_coordinates: number[][], neighbour_coordinates: number[][]): number[][] {
    let progress = new Progress(`mergePolygons`, probe_coordinates.length * neighbour_coordinates.length, true);
    const ret: number[][] = [];

    const mergeInfo = this.canMergePolygons(probe_coordinates, neighbour_coordinates);

    let nextIdxI = mergeInfo.idxI + 1;
    if (nextIdxI === probe_coordinates.length) {
      nextIdxI = 1;
    }
    let nextIdxC = mergeInfo.idxC - 1;
    if (nextIdxC < 0) {
      nextIdxC = neighbour_coordinates.length - 2;
    }

    console.log(probe_coordinates, neighbour_coordinates)

    if (probe_coordinates[nextIdxI][0] === neighbour_coordinates[nextIdxC][0] && probe_coordinates[nextIdxI][1] === neighbour_coordinates[nextIdxC][1]) {

      let nextnextIdxI = nextIdxI + 1;
      if (nextnextIdxI === probe_coordinates.length) {
        nextnextIdxI = 1;
      }
      let nextnextIdxC = nextIdxC - 1;
      if (nextnextIdxC < 0) {
        nextnextIdxC = neighbour_coordinates.length - 2;
      }

      if (probe_coordinates[nextnextIdxI][0] === neighbour_coordinates[nextnextIdxC][0] && probe_coordinates[nextnextIdxI][1] === neighbour_coordinates[nextnextIdxC][1]) {

        let nextnextnextIdxI = nextnextIdxI + 1;
        if (nextnextnextIdxI === probe_coordinates.length) {
          nextnextnextIdxI = 1;
        }
        let nextnextnextIdxC = nextnextIdxC - 1;
        if (nextnextnextIdxC < 0) {
          nextnextnextIdxC = neighbour_coordinates.length - 2;
        }

        if (probe_coordinates[nextnextnextIdxI][0] === neighbour_coordinates[nextnextnextIdxC][0] && probe_coordinates[nextnextnextIdxI][1] === neighbour_coordinates[nextnextnextIdxC][1]) {
          // console.log(nextnextnextIdxI, nextnextnextIdxC)
          // console.log(probe_coordinates[idxI],neighbour_coordinates[idxC],
          //             probe_coordinates[nextIdxI],neighbour_coordinates[nextIdxC],
          //             probe_coordinates[nextnextnextIdxI],neighbour_coordinates[nextnextnextIdxC]);
          console.log('nextnextnext')
        } else {
          // console.log(nextnextIdxI, nextnextIdxC)
          // console.log(probe_coordinates[idxI],neighbour_coordinates[idxC],
          //             probe_coordinates[nextIdxI],neighbour_coordinates[nextIdxC]);
          console.log('nextnext')
        }
      } else {
        let useRotated = false;
        let probe_coordinates_copy = [...probe_coordinates];

        if (mergeInfo.idxI === 0 || mergeInfo.idxI === probe_coordinates.length - 1 || nextIdxI === 0 || nextIdxI === probe_coordinates.length - 1) {
          useRotated = true;
          while (mergeInfo.idxI === 0 || mergeInfo.idxI === probe_coordinates.length - 1 || nextIdxI === 0 || nextIdxI === probe_coordinates.length - 1) {
            probe_coordinates_copy = this.rotateRightPolygon(probe_coordinates_copy);
            if (nextIdxI === probe_coordinates.length - 1) {
              nextIdxI = 1;
            } else {
              nextIdxI++;
            }
            if (mergeInfo.idxI === probe_coordinates.length - 1) {
              mergeInfo.idxI = 1;
            } else {
              mergeInfo.idxI++;
            }
          }
          for (let i = 0; i < mergeInfo.idxI; i++) {
            ret.push([...probe_coordinates_copy[i]]);
          }
        } else {
          for (let i = 0; i < mergeInfo.idxI; i++) {
            ret.push([...probe_coordinates[i]]);
          }
        }

        if (nextIdxC < mergeInfo.idxC) {
          let neighbour_coordinates_copy = [...neighbour_coordinates];
          while (mergeInfo.idxC > 0) {
            neighbour_coordinates_copy = this.rotateLeftPolygon(neighbour_coordinates_copy);
            if (nextIdxC === 0) {
              nextIdxC = neighbour_coordinates.length - 2;
              mergeInfo.idxC--;
            } else {
              nextIdxC--;
              mergeInfo.idxC--;
            }
          }
          for (let c = mergeInfo.idxC; c <= nextIdxC; c++) {
            ret.push([...neighbour_coordinates_copy[c]]);
          }
        } else {
          for (let c = mergeInfo.idxC; c <= nextIdxC; c++) {
            ret.push([...neighbour_coordinates[c]]);
          }
        }

        if (useRotated) {
          for (let i = nextIdxI + 1; i < probe_coordinates_copy.length; i++) {
            ret.push([...probe_coordinates_copy[i]]);
          }
        } else {
          for (let i = nextIdxI + 1; i < probe_coordinates.length; i++) {
            ret.push([...probe_coordinates[i]]);
          }
        }
        ret.push(ret[0]);
      }
    }
    console.log(ret)
    progress.stop();
    return ret;
  }

  public getCoriolisIntensity(latitude: number, omega = 7.2921159e-5): number {
    const phi = (Math.PI / 180) * latitude;
    const intensidade = 2 * omega * Math.sin(phi);

    // Determina a direção do efeito Coriolis (Norte ou Sul)
    //const direcao = intensidade > 0 ? "Norte" : "Sul";
    // a força coriolis eh sempre perpendicular ao vetor velocidade do objetouh
    return intensidade;
  }

  public getThermalIntensity(latitude: number, semanaDoAno: number, inclinacaoAxial = 23.5, diasNoAno = 365, intensidadeMaximaDoSol = 1361): number {
    // Calcula a declinação solar com base na latitude e na semana do ano.
    const declinacaoSolar = -inclinacaoAxial * Math.cos((2 * Math.PI * (semanaDoAno + 10) / diasNoAno));

    // Calcula a intensidade térmica com base na latitude e declinação solar.
    const intensidade = intensidadeMaximaDoSol * Math.sin((latitude * Math.PI) / 180) * Math.sin(declinacaoSolar);

    return intensidade;
  }

  public getSunAngle(latitude: number, longitude: number, semanaDoAno: number, horaDoDia: number, inclinacaoAxial = 23.5, diasNoAno = 365): number {
    // Converte a latitude e a longitude de graus para radianos.
    const latitudeRadianos = (latitude * Math.PI) / 180;

    // Calcula a declinação solar com base na semana do ano.
    const declinacaoSolar = -inclinacaoAxial * Math.cos((2 * Math.PI * (semanaDoAno + 10) / diasNoAno));

    // Calcula o ângulo horário com base na hora do dia e na longitude.
    const anguloHorario = (horaDoDia - 12) * 15 + (longitude * 15);

    // Calcula o ângulo de incidência solar.
    const anguloIncidenciaSolar = Math.asin(Math.sin(latitudeRadianos) * Math.sin(declinacaoSolar) + Math.cos(latitudeRadianos) * Math.cos(declinacaoSolar) * Math.cos(anguloHorario * Math.PI / 180));

    // Converte o ângulo de radianos para graus.
    const anguloIncidenciaSolarGraus = (anguloIncidenciaSolar * 180) / Math.PI;

    return anguloIncidenciaSolarGraus;
  }

  public getUmidityByBiome(biome: string, fator: 'evapotranspiracao' | 'evaporacao' | 'emissoes' | 'precipitacao'): number {
    const matrizEmissaoUmidade: { [id: string]: { evapotranspiracao: number, evaporacao: number, emissoes: number, precipitacao: number }; } = {
      planicie: { //Planícies: Terrenos planos e abertos, geralmente com vegetação rasteira.
        evapotranspiracao: 0.08,
        evaporacao: 0.1,
        emissoes: 0.03,
        precipitacao: -0.05,
      },
      morro: { //Montanhas/Morros: Terrenos mais elevados e acidentados.
        evapotranspiracao: 0.05,
        evaporacao: 0.08,
        emissoes: 0.02,
        precipitacao: -0.04,
      },
      selva: { //Selva/Floresta: Ambientes densamente arborizados e úmidos.
        evapotranspiracao: 0.12,
        evaporacao: 0.15,
        emissoes: 0.05,
        precipitacao: -0.2,
      },
      deserto: { //Deserto: Ambientes áridos e secos.
        evapotranspiracao: 0.03,
        evaporacao: 0.02,
        emissoes: 0.01,
        precipitacao: -0.01,
      },
      tundra: { //Tundra: Regiões frias e com vegetação esparsa.
        evapotranspiracao: 0.02,
        evaporacao: 0.03,
        emissoes: 0.01,
        precipitacao: -0.02,
      },
      urbano: { //Áreas Urbanas: Áreas construídas com edifícios e pavimentos.
        evapotranspiracao: 0.07,
        evaporacao: 0.09,
        emissoes: 0.05,
        precipitacao: -0.06,
      },
      corpoDagua: { //Corpos d'água: Rios, lagos, oceanos e outras massas de água.
        evapotranspiracao: 0.1,
        evaporacao: 0.12,
        emissoes: 0.02,
        precipitacao: -0.1,
      },
      zonaCosteira: { //Zonas costeiras: Áreas onde a terra encontra o mar.
        evapotranspiracao: 0.1,
        evaporacao: 0.12,
        emissoes: 0.03,
        precipitacao: -0.08,
      },
      agricola: { //Áreas agrícolas: Terras usadas para a agricultura.
        evapotranspiracao: 0.1,
        evaporacao: 0.1,
        emissoes: 0.04,
        precipitacao: -0.07,
      },
      polar: { //Regiões polares: Áreas extremamente frias próximas aos polos.
        evapotranspiracao: 0.02,
        evaporacao: 0.01,
        emissoes: 0.01,
        precipitacao: -0.02,
      },
      vulcanico: { //Terrenos vulcânicos: Áreas com atividade vulcânica.
        evapotranspiracao: 0.03,
        evaporacao: 0.02,
        emissoes: 0.01,
        precipitacao: -0.02,
      },
      rochoso: { //Terrenos rochosos: Regiões com solo rochoso e pouca vegetação.
        evapotranspiracao: 0.04,
        evaporacao: 0.03,
        emissoes: 0.02,
        precipitacao: -0.03,
      },
    };
    return matrizEmissaoUmidade[biome][fator];
  }

  public calcularPressaoAtmosferica(altitude: number, temperatura: number, umidade: number, g = 9.81): number {
    return this.calcularDensidadeAr(temperatura, umidade) * g * altitude;
  }

  public calcularDensidadeAr(temperatura: number, umidade: number, temperaturaPadrao = 273.15/*Temperatura em Kelvin (0°C)*/, densidadePadrao = 1.225 /* Densidade do ar a 0°C e 1 atm de pressão.*/): number {
    // Suponhamos que a densidade diminui 0,1% para cada 1% de umidade relativa.
    const fatorUmidade = 1 - (umidade / 100) * 0.001;
    // Calcule a densidade do ar com base na temperatura e na umidade.
    const densidadeAr = densidadePadrao * ((temperatura + temperaturaPadrao)/ temperaturaPadrao) * fatorUmidade;

    return densidadeAr;
  }
}
