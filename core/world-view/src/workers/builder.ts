import { Document, Node } from 'nodom';
import { GeoJson } from './_models/geojson';
import { PseudoRandom } from "./_tools/pseudo-random";
import * as d3 from 'd3';
import * as d3V from 'd3-geo-voronoi';

// const d3 = await Promise.all([
//   import("d3"),
//   import("d3-geo"),
//   import("d3-geo-voronoi")
// ]).then(d3 => Object.assign({}, ...d3));

export class Builder {
  private pseudo: PseudoRandom;
  private step = Math.PI / 30;

  constructor(public seed: number) {
    this.pseudo = new PseudoRandom(seed);
  }

  public render(siteSize: number): Promise<GeoJson> {
    console.log('pre  voronoi')
    return new Promise<GeoJson>((resolve, reject) => {
      try {
        const points: number[][] = [];
        d3.range(0, siteSize ?? 18).forEach((_: number) => {
          points.push([this.toDegrees(Math.PI * this.pseudo.random - (Math.PI / 2)), this.toDegrees((2 * Math.PI) * this.pseudo.random)]);
        });
        const voronoi: GeoJson = d3V.geoVoronoi()
          .x((p: number[]) => +p[0])
          .y((p: number[])=> +p[1])
          (points).polygons();
        console.log('voronoi', voronoi);

        // const meshes = []
        // d3.range(0, 2 * Math.PI, step).forEach(u => {
        //   d3.range(-Math.PI / 2, Math.PI / 2, step).forEach(v => {
        //     const param = [
        //       { u: u, v: v },
        //       { u: u + step, v: v },
        //       { u: u + step, v: v + step },
        //       { u: u, v: v + step }
        //     ];

        //     meshes.push(handlePoints(...param.map(p => processPoint(p))));
        //   })
        // })

        resolve(voronoi);
      }
      catch (error) {
        console.log('render failed', error);
        reject(error);
      }
    });
  }

  private toDegrees(angle: number): number {
    return angle * (180 / Math.PI);
  }
}