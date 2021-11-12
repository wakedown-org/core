import { GeoJson } from './_models/geojson';
import { PseudoRandom } from "./_tools/pseudo-random";
import { Perlin } from './_tools/perlin.noise';
import * as d3 from 'd3';
import * as d3V from 'd3-geo-voronoi';
import * as d3P from 'd3-polygon';

// const d3 = await Promise.all([
//   import("d3"),
//   import("d3-polygon"),
//   import("d3-geo-voronoi")
// ]).then(d3 => Object.assign({}, ...d3));

export class Builder {
  private pseudo: PseudoRandom;
  private step = this.truncate(Math.PI / 30);
  public insidePointsCount = 0;
  public rejected: number[][] = [];

  constructor(public seed: number) {
    this.pseudo = new PseudoRandom(seed);
  }

  public render(siteSize: number): Promise<GeoJson> {
    return new Promise<GeoJson>(async (resolve, reject) => {
      try {
        const points: number[][] = [];
        d3.range(0, siteSize ?? 18).forEach((_: number) => {
          points.push([this.toDegrees(Math.PI * this.pseudo.random - (Math.PI / 2)), this.toDegrees((2 * Math.PI) * this.pseudo.random)]);
        });
        const voronoi: GeoJson = d3V.geoVoronoi()
          .x((p: number[]) => +p[0])
          .y((p: number[]) => +p[1])
          (points).polygons();

        console.log('voronoi', voronoi);
        resolve(voronoi);

        // const array = [
        //   [-10.943776516259296, -9.473774022356865],
        //   [-48.039245448831984, 0.4010578846186669],
        //   [-52.73260442582173, 7.644128695713696],
        //   [-26.57444951201186, 56.684003908293],
        //   [58.28252020867874, 16.711695557267547],
        //   [44.02437380042392, -3.3832563839479723],
        //   [-10.943776516259296, -9.473774022356865]
        // ]
        // const dentro = [-21.488611400127407, 38.123002499341965];
        // const fora = [57.917682230472565, 128.84190693497658];

        // console.log('dentro', array, dentro, this.inside(array, dentro))
        // console.log('fora', fora, this.inside(array, fora))

        let count = 0;
        const us = d3.range(this.truncate(-Math.PI), this.truncate(Math.PI), this.step);
        const vs = d3.range(this.truncate(-Math.PI / 2), this.truncate(Math.PI / 2), this.step);

        // console.log('elaia', this.step, us, vs);

        let meshes: number[][] = [];
        this.rejected = [];

        for (let ui = 0; ui < us.length; ui++) {
          let u = us[ui];

          for (let vi = 0; vi < vs.length; vi++) {
            let v = vs[vi];

            const param = [
              [u, v],
              [this.truncate(u + this.step), v],
              [this.truncate(u + this.step), this.truncate(v + this.step)],
              [u, this.truncate(v + this.step)]
            ];

            count += param.length;

            meshes = this.handlePoints(meshes, param.map(p => this.processPoint(p, voronoi)));
          }
        }
        console.log('meshes', meshes.length, count, this.insidePointsCount, this.rejected.length, this.insidePointsCount + this.rejected.length);
        let found = 0;
        for (let idx = 0; idx < this.rejected.length; idx++) {
          const point = this.rejected[idx];
          const poly = this.findPolygonAux(point, voronoi);
          if (poly.length > 0)
            found++;
        }
        console.log('found', found, this.rejected.length);
      }
      catch (error) {
        console.log('render failed', error);
        reject(error);
      }
    });
  }

  private findPolygonAux(point: number[], voronoi: GeoJson): number[][] {
    for (let index = 0; index < voronoi.features.length; index++) {
      const polygon = (voronoi.features[index].geometry.coordinates as number[][][])[0];
      if (d3P.polygonContains(polygon.map(p => [p[0], p[1]]), [point[0], point[1]])) {
        return polygon;
      }
    }
    return [];
  }

  private inside(polygon: number[][], point: number[]): boolean {
    let inside = d3P.polygonContains(polygon.map(p => [p[0], p[1]]), [point[0], point[1]]);
    if (inside) {
      this.insidePointsCount++;
    }
    return inside;
  }

  private getGaussian(d: number, w: number, a = 0.5, b = 2): number {
    let n = Math.trunc(2 * b * w);
    if (n % 2 !== 0) n += 1;
    return a * Math.exp(-d * Math.exp(1) / w) ** n;
  }

  private findPolygon(point: number[], voronoi: GeoJson): { site: number[], polygon: number[][] } | null {
    for (let index = 0; index < voronoi.features.length; index++) {
      const feature = voronoi.features[index];
      const polygon = (feature.geometry.coordinates as number[][][])[0];
      const site = feature.properties.site as unknown as number[];
      //if (index % 1000 === 0) console.log('polygon', polygon, point)
      if (this.inside(polygon, point)) {
        return { site, polygon };
      }
    }
    this.rejected.push(point);
    return { site: point, polygon: [] };
  }

  private toDegrees(angle: number): number {
    return angle * (180 / Math.PI);
  }

  private processPoint(point: number[], voronoi: GeoJson): number[] {
    point = [this.toDegrees(point[0]), this.toDegrees(point[1])]
    const polygon = this.findPolygon(point, voronoi);
    const perlin = Perlin.Noise(point);
    if (polygon !== null) {
      if (polygon.polygon !== []) {
        const distance = this.findHypotenuse(Math.abs(point[0]) - Math.abs(polygon.site[0]), Math.abs(point[1]) - Math.abs(polygon.site[1]));
        const gauss = this.getGaussian(distance, 42 * this.pseudo.random);
        const t = this.truncate(gauss + perlin);
        return [
          ...point,
          t
        ];
      } else {
        // problematic point
        return point;
      }
    } else
      return [...point, this.truncate(this.getGaussian(4 * this.pseudo.random, 2 * this.pseudo.random) + perlin)];
  }

  private handlePoints(result: number[][], points: number[][]): number[][] {
    if (points.every(p => p[2] >= 0.5))
      points.forEach((point: number[]) => {
        this.addInIfInvertNotExistsAndRemoveItFrom(result, point);
      });
    return result;
  }

  private findHypotenuse(cathetiA: number, cathetiB: number, cathetiC: number = 0): number {
    return this.truncate(Math.sqrt(cathetiA ** 2 + cathetiB ** 2 + cathetiC ** 2));
  }

  private addInIfInvertNotExistsAndRemoveItFrom(vectors: number[][], vector: number[]): number[][] {
    const vectorIdx = vectors.findIndex((v) => this.equalsVector(this.inverseVector(vector), v));
    if (vectorIdx > -1) {
      vectors.splice(vectorIdx, 1);
    } else {
      vectors.push(vector);
    }
    return vectors;
  }

  private inverseVector(vector: number[]): number[] {
    return [vector[1], vector[0], vector[2]]
  }

  private equalsVector(vectorA: number[], vectorB: number[]): boolean {
    if (vectorA === vectorB) return true;
    if (vectorA == null || vectorB == null) return false;
    if (vectorA.length !== vectorB.length) return false;

    for (var i = 0; i < vectorA.length; ++i) {
      if (vectorA[i] !== vectorB[i]) return false;
    }
    return true;
  }

  private truncate(value: number, precision = 5): number {
    let result = value.valueOf();
    result = Math.trunc(Math.pow(10, precision) * value) / Math.pow(10, precision);
    // result = Math.abs(result);
    // result = result - Math.floor(result);
    // console.log('truncate', value, result)
    return result;
  }
}