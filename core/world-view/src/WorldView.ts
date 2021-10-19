import { html, css, LitElement, svg } from 'lit';
import { property } from 'lit/decorators.js';
import { until } from 'lit/directives/until.js';
import { GeoJson } from './workers/_models/geojson';

const d3 = await Promise.all([
  import("d3"),
  import("d3-delaunay"),
  import("d3-geo-voronoi")
]).then(d3 => Object.assign({}, ...d3));

export class WorldView extends LitElement {
  static styles = css`
  :host {
    margin: 0;
    padding: 0;
    color: var(--world-view-text-color, #000);
  }

  #sphere {
    fill: #ccc;
    stroke: #444;
    stroke-width: 2;
  }
  .polygons {
    stroke: #444;
  }

  .sites {
    stroke: black;
    fill: white;
  }
  `;

  @property({ type: Number }) seed = 8;
  @property({ type: Number }) width = 10;
  @property({ type: Number }) height = 5;

  @property({ type: String }) loading = svg`
<svg width="46%" height="98%" version="1.1" id="L6" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 100 100" enable-background="new 0 0 100 100" xml:space="preserve">
  <rect fill="none" stroke="#000" stroke-width="4" x="25" y="25" width="50" height="50">
    <animateTransform attributeName="transform" dur="1s" from="0 50 50" to="180 50 50" type="rotate" id="strokeBox" attributeType="XML" begin="rectBox.end"/>
  </rect>
  <rect x="27" y="27" fill="#000" width="46" height="50">
    <animate attributeName="height" dur="10s" attributeType="XML" from="50" to="0" id="rectBox" fill="freeze" begin="0s;strokeBox.end"/>
  </rect>
</svg>`;

  private _worker: Worker | null = null;

  @property({ type: String }) world = new Promise(resolve => {
    if (this._worker === null) {
      this._worker = new Worker('../dist/src/workers/worker.js', { type: 'module' });
      console.log('valendo!', this._worker)
      this._worker.onmessage = (event: any) => {
        console.log('onmessage', event);

        this.display(event.data.layers);
        resolve(svg``);
      }
      const data = { seed: this.seed, width: this.width, height: this.height };
      console.log('worker data', data);
      this._worker.postMessage(data);
    }
  });

  render() {
    const computedStyle = getComputedStyle(this);
    this.width = new Number(computedStyle.getPropertyValue('width').split('px')[0]).valueOf();
    this.height = new Number(computedStyle.getPropertyValue('height').split('px')[0]).valueOf();
    return html`
    <div id="world">
      ${until(this.world, this.loading)}
      <svg id="map" width="${this.width}" height="${this.height}" viewBox="0 0 ${this.width} ${this.height}"></svg>
    </div>
    `;
  }
  private projection = d3.geoOrthographic();
  private path = d3.geoPath().projection(this.projection);

  display(layers: GeoJson) {
    var svg = d3.select(this.shadowRoot?.getElementById("map"));
    console.log('svg', svg);

    svg.append('path')
      .attr('id', 'sphere')
      .datum({ type: "Sphere" })
      .attr('d', this.path);

    svg.append('g')
      .attr('class', 'polygons')
      .selectAll('path')
      .data(layers)
      .enter()
      .append('path')
      .attr('d', this.path)
      .attr('fill', (_: any, i: number) => d3.schemeCategory10[i % 10]);

    var c = {
      type: "MultiPoint",
      coordinates: layers.features.map(f => f.properties['site'])
        .map((d) => [+d[0], +d[1]])
    };

    console.log('eita', c);

    svg.append('path')
      .attr('class', 'sites')
      .datum(c)
      .attr('d', this.path);

    d3.interval((elapsed: number) => {
      this.projection.rotate([elapsed / 150, 0]);
      svg.selectAll('path')
        .attr('d', this.path);
    }, 50);
  }
}

