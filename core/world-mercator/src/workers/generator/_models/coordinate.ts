import { Helper } from "../_tools/helper";

export class Coordinate {
  constructor(public latitude: number, public longitude: number, public radius: number = 1) { }

  public addLatitude(value: number, precision = 5) {
    return new Coordinate(Helper.TruncDecimals(this.latitude + value, precision), this.longitude);
  }
  public addLongitude(value: number, precision = 5) {
    return new Coordinate(this.latitude, Helper.TruncDecimals(this.longitude + value, precision));
  }

  public isClose(a: Coordinate, margin = 42): boolean {
    return (Math.abs(a.latitude - this.latitude) < margin && Math.abs(a.longitude - this.longitude) < margin);
  }
}
