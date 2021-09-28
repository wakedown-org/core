import { svg, css, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { until } from 'lit/directives/until.js';

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
  private _worker: Worker | null = null;

  @property({ type: Number }) width = 1000;
  @property({ type: Number }) height = 500;
  @property({ type: Number }) scale = 1;
  @property({ type: String }) loading = svg`
<svg width="1280" height="800" version="1.1" id="L6" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 100 100" enable-background="new 0 0 100 100" xml:space="preserve">
  <rect fill="none" stroke="#000" stroke-width="4" x="25" y="25" width="50" height="50">
    <animateTransform attributeName="transform" dur="0.5s" from="0 50 50" to="180 50 50" type="rotate" id="strokeBox" attributeType="XML" begin="rectBox.end"/>
  </rect>
  <rect x="27" y="27" fill="#000" width="46" height="50">
    <animate attributeName="height" dur="1.3s" attributeType="XML" from="50" to="0" id="rectBox" fill="freeze" begin="0s;strokeBox.end"/>
</rect>
</svg>`;
  @property({ type: String }) layerPath = new Promise(resolve => {
    if (this._worker === null) {
      this._worker = new Worker('./dist/src/workers/worker.js', { type: 'module' });
      this._worker.onmessage = (event: any) => {
        resolve(svg`
<svg width="${this.width*this.scale}" height="${this.height*this.scale}" viewBox="0 0 ${this.width} ${this.height}">
  <path d="${event.data.path}"/>
</svg>`);
      }
      this._worker.postMessage({ seed: this.seed, width: this.width, height: this.height });
    }
  });

  constructor () {
    super();
  }

  render() {
    return svg`
      <div class="world">
        ${ until(this.layerPath, this.loading) }
      </div>
    `;
  }
}

