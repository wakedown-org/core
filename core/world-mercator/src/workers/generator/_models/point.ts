export class Point {
  constructor(public X: number, public Y: number, public Z: number) { }

  public equals(point: Point): boolean {
    return (this.X === point.X && this.Y === point.Y && this.Z === point.Z);
  }

  public copy(): Point {
    return new Point(this.X, this.Y, this.Y);
  }
}
