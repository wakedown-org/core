import { svg, css, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { until } from 'lit/directives/until.js';
import { WorldBuilder } from './generator/world-builder';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';

export class WorldMercator extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 25px;
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      color: var(--world-mercator-text-color, #000);
    }

    svg {
      display: block;
      fill: black;
      fill-rule: evenodd;
    }
  `;

  @property({ type: Number }) seed = 8;
  private _world: WorldBuilder = new WorldBuilder(this.seed);
  // private _worker: Worker = new Worker('./dist/src/workers/worker.js');

  @property({ type: Number }) prime = 1;
  @property({ type: Number }) width = 1000;
  @property({ type: Number }) height = 500;
  @property({ type: String }) layer = new Promise((resolve) => this._world.getLayer(this.width, this.height).then((layer) => resolve(svg`<path d="${layer.AsSvgPath()}"/>`)));

  constructor () {
    super();
    // this._worker.onmessage = (event) => this.prime = event.data;
  }

  render() {
    return svg`
      <div class="world">
        <svg width="${this.width}" height="${this.height}" viewBox="0 0 ${this.width} ${this.height}">
          ${ until(this.layer, '') }
        </svg>
      </div>
      <p>The highest prime number discovered so far is: <output id="result">${this.prime}</output></p>
    `;
  }

  // private drawMercator(context: CanvasRenderingContext2D, svg: SVGElement) {

  //   const width = 1000;//document.body.clientWidth - 40;
  //   const height = 500;//(document.body.clientHeight - 40);

  //   // this._world.GetAllMercatorPoints(width, height).then((points) => Helper.BuildImage(context, points, width, height));

  //   this._world.getLayer(width, height).then((layer) => Helper.CreatePathElement(svg, layer.AsSvgPath()));

  //   // this._world.getLongitudeLines(width, height).then((layer) => Helper.CreatePathElement(svg, layer.AsSvgPath(false), { fillOpacity: '.1', stroke: '#000', strokeWidth: '.5px' }));
  //   // this._world.getLatitudeLines(width, height, false).then((layer) => Helper.CreatePathElement(svg, layer.AsSvgPath(false), { fillOpacity: '.1', stroke: '#000', strokeWidth: '.5px' }));
  //   // this._world.getEquatorLines(width, height).then((layer) => Helper.CreatePathElement(svg, layer.AsSvgPath(false), { fillOpacity: '.1', stroke: '#F00', strokeWidth: '1px' }));
  //   // this._world.getTropicsAndCirclesLines(width, height).then((layer) => Helper.CreatePathElement(svg, layer.AsSvgPath(false), { fillOpacity: '.1', stroke: '#00F', strokeWidth: '1px' }));

  //   // this._world.getSunShadow(width, height).then((layer) => Helper.CreatePathElement(svg, layer.AsSvgPath(), { fillOpacity: '.8', stroke: '#000', strokeWidth: '0px' }));
  // }
}

