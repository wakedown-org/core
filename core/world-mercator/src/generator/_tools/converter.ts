import { Coordinate } from "../_models/coordinate";
import { Point } from "../_models/point";

/*
* latitude - Polo Norte 90° / Polo Sul -90° / Equador 0°
* longitudade - Leste 180° / Oeste -180° / Greenwich 0°
* em termos de latitude
* digito de unidade => 111km
* primeira casa decimal => 11,1km
* segunda casa decimal => 1,1km
* terceira casa decimal => 110m
* quarta casa decimal => 11m
* quinta casa decimal => 1,1m
*/

export class Converter {
  public static ToPolar(point: Point): Coordinate {
    return new Coordinate(
      Math.atan(point.Y / point.Z),
      Math.atan(Math.sqrt(Math.pow(point.X, 2) + Math.pow(point.Y, 2) / point.Z)),
      Math.sqrt(Math.pow(point.X, 2) + Math.pow(point.Y, 2) + Math.pow(point.Z, 2)));
  }
  public static ToCardian(coordinate: Coordinate): Point {
    return new Point(
      coordinate.radius * Math.cos(Converter.ToRadians(coordinate.longitude)) * Math.cos(Converter.ToRadians(coordinate.latitude)),
      coordinate.radius * Math.sin(Converter.ToRadians(coordinate.longitude)) * Math.cos(Converter.ToRadians(coordinate.latitude)),
      coordinate.radius * Math.sin(Converter.ToRadians(coordinate.latitude)));
  }
  public static ToDegrees(angle: number): number {
    return angle * (180 / Math.PI);
  }
  public static ToRadians(angle: number): number {
    return angle * (Math.PI / 180);
  }

  public static LongitudeLength(latitude: number, radius: number): number {
    return (Math.PI / 180) * radius * Math.cos(latitude);
  }

  public static ToMercator(coordinate: Coordinate, width: number, height: number): Point {
    return new Point(Math.round((coordinate.longitude + 180)/(360 / width)), Math.round((coordinate.latitude + 90)/(180 / height)), 0);
  }

  public static FromMercator(point: Point, width: number, height: number): Coordinate {
    return new Coordinate((point.Y * (180 / height)) - 90, (point.X * (360 / width)) - 180);
  }

  public static ToIdxWidth(point: Point, width: number): number {
    return (point.X + (point.Y) * width);
  }
}

export const RAD2DEG = 180 / Math.PI;
export const PI_4 = Math.PI / 4;
