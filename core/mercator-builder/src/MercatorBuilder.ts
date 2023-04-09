import { svg, css, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { until } from 'lit/directives/until.js';
import { asyncAppend } from 'lit/directives/async-append.js';

async function *handleLayers(layers: { [id: string]: string; }) {
  const keys = Object.keys(layers);
  for (let i = 0; i < keys.length; i++) {
      yield { name: keys[i], path: layers[keys[i]] };
  }
}

export class MercatorBuilder extends LitElement {
  static styles = css`
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

  private _worker: Worker | null = null;

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
      this._worker = new Worker('./dist/src/workers/worker.js', { type: 'module' });
      this._worker.onmessage = (event: any) => {
        const data = event.data as { layers: { [id: string]: string; }};
        resolve(svg`
<svg width="${this.width}" height="${this.height}" viewBox="0 0 ${this.width * this.scale} ${this.height * this.scale}">
  ${asyncAppend(handleLayers(data.layers), (layer: any) => svg`<path id="${layer.name}" d="${layer.path}"/>`)}
</svg>`);
    }
    this._worker.postMessage({ seed: this.seed, width: this.width * this.scale, height: this.height * this.scale });
  }
  });

constructor() {
  super();
}

render() {
  return svg`
      <div class="world">
        ${until(this.world, this.loading)}
      </div>
    `;
}
}

