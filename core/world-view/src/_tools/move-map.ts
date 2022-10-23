import versor from "versor";

export class moveMap {
  private v0: any;
  private q0: any;
  private r0: any;

  constructor (private projection: any) {

  }
  // function pointer(event, that) {
  //   const t = d3.pointers(event, that);

  //   if (t.length !== l) {
  //     l = t.length;
  //     if (l > 1) a0 = Math.atan2(t[1][1] - t[0][1], t[1][0] - t[0][0]);
  //     dragstarted.apply(that, [event, that]);
  //   }

  //   // For multitouch, average positions and compute rotation.
  //   if (l > 1) {
  //     const x = d3.mean(t, (p) => p[0]);
  //     const y = d3.mean(t, (p) => p[1]);
  //     const a = Math.atan2(t[1][1] - t[0][1], t[1][0] - t[0][0]);
  //     return [x, y, a];
  //   }

  //   return t[0];
  // }

  // function dragstarted(event) {
  //   v0 = versor.cartesian(projection.invert(pointer(event, this)));
  //   q0 = versor(r0 = projection.rotate());
  // }

  // function dragged(event) {
  //   const p = pointer(event, this);
  //   const v1 = versor.cartesian(projection.rotate(r0).invert(p));
  //   const delta = versor.delta(v0, v1);
  //   let q1 = versor.multiply(q0, delta);

  //   // For multitouch, compose with a rotation around the axis.
  //   if (p[2]) {
  //     const d = (p[2] - a0) / 2;
  //     const s = -Math.sin(d);
  //     const c = Math.sign(Math.cos(d));
  //     q1 = versor.multiply([Math.sqrt(1 - s * s), 0, 0, c * s], q1);
  //   }

  //   projection.rotate(versor.rotation(q1));

  //   // In vicinity of the antipode (unstable) of q0, restart.
  //   if (delta[0] < 0.7) dragstarted.apply(this, [event, this]);
  // }

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