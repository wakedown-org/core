import { Point } from "./point";

export class Vector {
  constructor(public start: Point, public end: Point) { }

  public get inverted(): Vector {
    return new Vector(this.end, this.start);
  }

  public get copy(): Vector {
    return new Vector(this.start, this.end);
  }

  public containsIn(array: Vector[]): boolean {
    for (let i = 0; i < array.length; i++) {
      if ((array[i].start.equals(this.start)) && (array[i].end.equals(this.end))) {
        return true;
      }
    }
    return false;
  }

  public isCollinear(a: Point): boolean {
    const A = this.start.X * (this.end.Y - a.Y) + this.end.X * (a.Y - this.start.Y) + a.X * (this.start.Y - this.end.Y);
    return A === 0;
  }

  public isClockwise(vector: Vector): boolean {
    const dot = (this.end.X - this.start.X)*(vector.end.X - vector.start.X) + (this.end.Y - this.start.Y)*(vector.end.Y - vector.start.Y);
    const det = (this.end.X - this.start.X)*(vector.end.Y - vector.start.Y) - (this.end.Y - this.start.Y)*(vector.end.X - vector.start.X);
    return Math.atan2(det, dot) > 0;
  }

  public equals(vector: Vector): boolean {
    return (this.start.equals(vector.start) && this.end.equals(vector.end));
  }

  public static AddInIfInvertNotExistsAndRemoveItFrom(vectors: Vector[], vector: Vector): Vector[] {
    const vectorIdx = vectors.findIndex((v) => vector.inverted.equals(v));
    if (vectorIdx > -1) {
      vectors.splice(vectorIdx, 1);
    } else {
      vectors.push(vector);
    }
    return vectors;
  }
}
