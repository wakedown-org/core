import {LitElement, css, svg} from 'lit';
import {customElement, property} from 'lit/decorators.js';


import { until } from 'lit/directives/until.js';
// import { asyncAppend } from 'lit/directives/async-append.js';

import * as d3 from "d3";

import versor from "versor";
import { GeoJson, GeoJsonFeature, GeoJsonMultiPoint } from './models/geojson';

// const d3 = await Promise.all([
//   import("d3"),
//   import("d3-drag"),
//   import("d3-delaunay"),
//   import("d3-geo"),
//   import("d3-geo-voronoi"),
//   import("d3-zoom")
// ]).then(d3 => Object.assign({}, ...d3));

// async function* handleLayers(layers: { [id: string]: string; }) {
//   const keys = Object.keys(layers);
//   for (let i = 0; i < keys.length; i++) {
//     yield { name: keys[i], path: layers[keys[i]] };
//   }
// }

class moveMap {
  private v0: any;
  private q0: any;
  private r0: any;

  constructor (private projection: any) {

  }

  public static _origin(): number[] {
    return [0, 0];
  }

  public static _center(width: number, height: number): number[] {
    return [
      this.truncateInt(width/2),
      this.truncateInt(height/2)
    ];
  }

  public dragstarted(point: any[]) {
    this.v0 = versor.cartesian(this.projection.invert(point));
    this.r0 = this.projection.rotate();
    this.q0 = versor(this.r0);
  }

  public dragged(point: any[]) {
    var v1 = versor.cartesian(this.projection.rotate(this.r0).invert(point)),
      q1 = versor.multiply(this.q0, versor.delta(this.v0, v1)),
      r1 = versor.rotation(q1);
    this.projection.rotate(r1);
  }

  public zoom(factor: number) {
    this.projection.scale(10 ** (factor));
  }

  public showLoc(point: any[]) {
    return this.projection.invert(point);
  }

  public static interpolateProjection(d3: any, raw0: any, raw1: any) {
    const mutate = d3.geoProjectionMutator((t: any) => (x: any, y: any) => {
      const [x0, y0] = raw0(x, y), [x1, y1] = raw1(x, y);
      return [x0 + t * (x1 - x0), y0 + t * (y1 - y0)];
    });
    let t = 0;
    return Object.assign(mutate(t), {
      alpha(_: any) {
        return arguments.length ? mutate(t = +_) : t;
      }
    });
  }

  public static truncateInt(number: number): number {
    return Math.trunc(number);
  }
}

@customElement('main-view')
export class mainView extends LitElement {
  static override styles = css`
  :host {
    padding: 25px;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    color: var(--world-mercator-text-color, #000);
  }

  .world {
    position: absolute;
    top: 0;
    left: 0;
  }

  #canvas {
    position: absolute;
    top: 0;
    left: 0;
  }

  svg {
    display: block;
    fill: black;
    fill-rule: evenodd;
    background: black;
  }

  path:hover{
    fill: red;
  }

  #shoreline {
    fill: rgba(0, 198, 255, 255);
  }

  #swallowWater {
    fill: rgba(0, 191, 255, 255);
  }

  #deepWater {
    fill: rgba(65, 105, 225, 255);
  }

  #grass {
    fill: rgba(50, 205, 50, 255);
  }

  #woods {
    fill: rgba(34, 139, 34, 255);
  }

  #forest {
    fill: rgba(0, 100, 0, 255);
  }

  #sandy {
    fill: rgba(210, 180, 140, 255);
  }

  #beach {
    fill: rgba(238, 214, 175, 255);
  }

  #mountain {
    fill: rgba(139, 137, 137, 255);
  }

  #snow {
    fill: rgba(255, 250, 250, 255);
  }

  .cell {
    opacity: 0.5;
    fill: none;
    stroke: black;
  }

  .peak {
    fill: red;
  }

  .valley {
    fill: orange;
  }
`;

// private _moveMap: moveMap | null = null;
private _rotationPaused = true;
private _worker: Worker | null = null;

@property({ type: Boolean }) isFlat = true;
@property({ type: Number }) seed = 8;
@property({ type: Number }) width = 880;
@property({ type: Number }) height = 440;
@property({ type: Number }) scale = 1;
@property({ type: String }) loading = svg`
<svg width="${this.width}" height="${this.height}" version="1.1" id="L6" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 100 100" enable-background="new 0 0 100 100" xml:space="preserve">
<rect fill="none" stroke="#000" stroke-width="4" x="25" y="25" width="50" height="50">
  <animateTransform attributeName="transform" dur="1s" from="0 50 50" to="180 50 50" type="rotate" id="strokeBox" attributeType="XML" begin="rectBox.end"/>
</rect>
<rect x="27" y="27" fill="#000" width="46" height="50">
  <animate attributeName="height" dur="10s" attributeType="XML" from="50" to="0" id="rectBox" fill="freeze" begin="0s;strokeBox.end"/>
</rect>
</svg>`;
@property({ type: String }) world = new Promise(resolve => {
  if (this._worker === null) {
    this._worker = new Worker('../workers/worker.js', { type: 'module' });
    this._worker.onmessage = (event: any) => {
      // const data = event.data as { layers: { [id: string]: string; } };
      this.display(event.data.layers);
      resolve(svg`

      `);
      /*
      <svg width="${this.width}" height="${this.height}" viewBox="0 0 ${this.width * this.scale} ${this.height * this.scale}">
${ asyncAppend(handleLayers(data.layers), (layer: any) => svg`<path id="${layer.name}" d="${layer.path}"/>`) }
</svg>
      */
    }
    this._worker.postMessage({ seed: this.seed, width: this.width * this.scale, height: this.height * this.scale });
  }
});

  override render() {
    // const computedStyle = getComputedStyle(this);
    // this.width = new Number(computedStyle.getPropertyValue('width').split('px')[0]).valueOf();
    // this.height = new Number(computedStyle.getPropertyValue('height').split('px')[0]).valueOf();
 //
 return svg`
 <div class="world">
   ${until(this.world, this.loading)}
   <svg id="map" width="${this.width}" height="${this.height}" viewBox="0 0 ${this.width} ${this.height}"></svg>
 </div>
`;
  }

  display(layers: GeoJson, showSite = false, scale = 2.2, center: number[] | null = null) {
    if (center === null) center = moveMap._origin();
    const projection = (this.isFlat ?
      d3.geoEquirectangular() :
      d3.geoOrthographic()).scale(10 ** scale).center([center[0],center[1]]);

    const path = <d3.GeoPath<any,any>>d3.geoPath().projection(projection);

    var svg = d3.select(this.renderRoot.querySelector("#map"));
    // this._moveMap = new moveMap(projection);

    svg.append('g')
      .attr('class', 'polygons')
      .selectAll('path')
      .data(layers.features)
      .enter()
      .append('path')
      .attr('d', path)
      .attr('fill', (feature: GeoJsonFeature, i: number) => {
        switch(feature.properties['biome']) {
          case 'shoreline': return 'rgba(0, 198, 255, 255)';
          case 'swallowWater': return 'rgba(0, 191, 255, 255)';
          case 'deepWater': return 'rgba(65, 105, 225, 255)';
          case 'grass': return 'rgba(50, 205, 50, 255)';
          case 'woods': return 'rgba(34, 139, 34, 255)';
          case 'forest': return 'rgba(0, 100, 0, 255)';
          case 'sandy': return 'rgba(210, 180, 140, 255)';
          case 'beach': return 'rgba(238, 214, 175, 255)';
          case 'mountain': return 'rgba(139, 137, 137, 255)';
          case 'snow': return 'rgba(255, 250, 250, 255)';
          case 'border': return 'rgba(5, 5, 5, 255)';
          default: return d3.schemeCategory10[i % 10];
        }
      });

    svg.append('path')
      .attr('class', 'sites')
      .datum(showSite ?
        new GeoJsonMultiPoint(layers.features.map(f => f.properties['sitecoordinates']).map((d) => [+d[0], +d[1]])) :
        new GeoJsonMultiPoint([center]))
      .attr('d', path);

    d3.interval((elapsed: number) => {
      if (!this._rotationPaused) {
        projection.rotate([elapsed / 150 % 360, 0]);
        svg.selectAll('path').attr('d', path);
      }
    }, 50);

    // svg.call(
    //   d3.drag(svg)
    //     .on("start", (d: any) => {
    //       this._rotationPaused = true;
    //       this._moveMap?.dragstarted([d.x, d.y]);
    //     })
    //     .on("drag", (d: any) => {
    //       this._moveMap?.dragged([d.x, d.y]);
    //       svg.selectAll('path').attr('d', path);
    //     })).
    //   on("end", (d: any) => {
    //     this._rotationPaused = false;
    //   });
    // svg.call(
    //   d3.zoom().on("zoom", (d: any) => {
    //     this._moveMap?.zoom(scale * d.transform.k);
    //     svg.selectAll('path').attr('d', path);
    //   })
    // )
    // svg.on("click", (d: any) => {
    //   console.log('click', [d.x, d.y], projection.invert([d.x, d.y]))
    //   // this._moveMap?.dragstarted([d.x, d.y]);
    //   // this._moveMap?.dragged(moveMap._center(this.width, this.height));

    //   // svg.selectAll('path').attr('d', path);
    //   // this._rotationPaused = false;
    // })


  }
}

declare global {
  interface HTMLElementTagNameMap {
    'main-view': mainView;
  }
}
