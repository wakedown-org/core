import { Point } from "./point";
import { Vector } from "./vector";

export class Layer {
  constructor(public limit: Vector[] = [], public innerLayers: Layer[] = []) { }

  public shrunk(): Layer {
    const layer = [...this.limit];
    const array = [];
    let runner: Vector = layer[0].copy;
    for (let i = 1; i < layer.length; i++) {
      if (runner.isCollinear(layer[i].end)) {
        runner = new Vector(runner.start, layer[i].end);
      } else {
        array.push(runner.copy);
        runner = layer[i].copy;
      }
    }
    array.push(runner.copy);
    return new Layer(array, this.innerLayers);
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

  public static DefaultSort(l1: Layer, l2: Layer): number {
    if (l1.limit.length > l2.limit.length)
      return 1;
    if (l1.limit.length < l2.limit.length)
      return -1
    return 0;
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
    console.log('svg', path);
    return path;
  }

  public static Transform(allVectors: Vector[]): Layer {
    const copyVectors = [ ...allVectors ];
    const closedCircuits: Layer[] = [];
      while (copyVectors.length > 0) {
        const vectors: Vector[] = [];
        const startVector = copyVectors.pop()!;
        vectors.push(startVector.copy);
        let runner = startVector.copy;
        while (!runner.end.equals(startVector.start)) {
          const vectorIdx = copyVectors.findIndex((v) => runner.end.equals(v.start));
          runner = copyVectors.splice(vectorIdx, 1)[0];
          vectors.push(runner.copy);
        }
        closedCircuits.push(new Layer(vectors).shrunk());
      }
      //console.log('closedCircuits', closedCircuits.length, new Date());
      const layer = new Layer();
      layer.innerLayers = closedCircuits;
      layer.Process();
      return layer;
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
