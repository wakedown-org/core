import { GeoJson } from './_models/geojson';
import { PseudoRandom } from "./_tools/pseudo-random";
import { Perlin } from './_tools/perlin.noise';
import * as d3 from 'd3';
import * as d3G from 'd3-geo';
import * as d3V from 'd3-geo-voronoi';
import polyInside from '../_tools/inside';

// const d3 = await Promise.all([
//   import("d3"),
//   import("d3-geo"),
//   import("d3-geo-voronoi")
// ]).then(d3 => Object.assign({}, ...d3));

export class Builder {
  private pseudo: PseudoRandom;
  //private step = this.truncate(Math.PI / 30);
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
          points.push([
            360 * this.pseudo.random - 180,
            180 * this.pseudo.random - 90
          ]);
        });
        const voronoi: GeoJson = d3V.geoVoronoi()
          .x((p: number[]) => +p[0])
          .y((p: number[]) => +p[1])
          (points).polygons();

        resolve(voronoi);

        this.checkVoronoi(voronoi);
      }
      catch (error) {
        console.log('render failed', error);
        reject(error);
      }
    });
  }

  private checkVoronoi(voronoi: GeoJson): void {
    voronoi.features.forEach((element, idx) => {
      voronoi.features.forEach((element2, idx2) => {
        const polygon: any = element;
        const site: any = element2.properties.sitecoordinates;

        const inside = d3.geoContains(polygon, site);

        console.log('check site', idx, idx2, inside);
      });
    });
  }

  // private getGaussian(d: number, w: number, a = 0.2, b = 8): number {
  //   return 1/2*(1 + (d/(a * w) ** (2 * a * b * w)));
  // }

  // private findPolygon(point: number[], voronoi: GeoJson): { site: number[], polygon: number[][] } | null {
  //   for (let index = 0; index < voronoi.features.length; index++) {
  //     const feature = voronoi.features[index];
  //     const polygon = (feature.geometry.coordinates as number[][][])[0];
  //     const site = feature.properties.site as unknown as number[];
  //     //if (index % 1000 === 0) console.log('polygon', polygon, point)
  //     if (this.inside(polygon, point)) {
  //       return { site, polygon };
  //     }
  //   }
  //   this.rejected.push(point);
  //   return { site: point, polygon: [] };
  // }

  // private toDegrees(angle: number): number {
  //   return angle * (180 / Math.PI);
  // }

  // private processPoint(point: number[], voronoi: GeoJson): number[] {
  //   point = [this.toDegrees(point[0]), this.toDegrees(point[1])]
  //   const polygon = this.findPolygon(point, voronoi);
  //   const perlin = Perlin.Noise(point);
  //   if (polygon !== null) {
  //     if (polygon.polygon.length !== 0) {
  //       const distance = this.findHypotenuse(Math.abs(point[0]) - Math.abs(polygon.site[0]), Math.abs(point[1]) - Math.abs(polygon.site[1]));
  //       const gauss = this.getGaussian(distance, 42 * this.pseudo.random);
  //       const t = this.truncate(gauss + perlin);
  //       return [
  //         ...point,
  //         t
  //       ];
  //     } else {
  //       // problematic point
  //       return point;
  //     }
  //   } else
  //     return [...point, this.truncate(this.getGaussian(4 * this.pseudo.random, 2 * this.pseudo.random) + perlin)];
  // }

  // private handlePoints(result: number[][], points: number[][]): number[][] {
  //   if (points.every(p => p[2] >= 0.5))
  //     points.forEach((point: number[]) => {
  //       this.addInIfInvertNotExistsAndRemoveItFrom(result, point);
  //     });
  //   return result;
  // }

  // private findHypotenuse(cathetiA: number, cathetiB: number, cathetiC: number = 0): number {
  //   return this.truncate(Math.sqrt(cathetiA ** 2 + cathetiB ** 2 + cathetiC ** 2));
  // }

  // private addInIfInvertNotExistsAndRemoveItFrom(vectors: number[][], vector: number[]): number[][] {
  //   const vectorIdx = vectors.findIndex((v) => this.equalsVector(this.inverseVector(vector), v));
  //   if (vectorIdx > -1) {
  //     vectors.splice(vectorIdx, 1);
  //   } else {
  //     vectors.push(vector);
  //   }
  //   return vectors;
  // }

  // private inverseVector(vector: number[]): number[] {
  //   return [vector[1], vector[0], vector[2]]
  // }

  // private equalsVector(vectorA: number[], vectorB: number[]): boolean {
  //   if (vectorA === vectorB) return true;
  //   if (vectorA == null || vectorB == null) return false;
  //   if (vectorA.length !== vectorB.length) return false;

  //   for (var i = 0; i < vectorA.length; ++i) {
  //     if (vectorA[i] !== vectorB[i]) return false;
  //   }
  //   return true;
  // }

  // private truncate(value: number, precision = 5): number {
  //   let result = value.valueOf();
  //   result = Math.trunc(Math.pow(10, precision) * value) / Math.pow(10, precision);
  //   // result = Math.abs(result);
  //   // result = result - Math.floor(result);
  //   // console.log('truncate', value, result)
  //   return result;
  // }
}