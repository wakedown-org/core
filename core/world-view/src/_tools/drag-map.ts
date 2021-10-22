import versor from "versor";

export function dragMap(d3: any, svg: SVGElement, projection: any) {
  let v0: any, q0: any, r0: any, a0: any, l: any;

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

  function dragstarted() {
    v0 = versor.cartesian(projection.invert(d3.pointers(svg)));
    r0 = projection.rotate();
    q0 = versor(r0);
  }

  function dragged() {
    var v1 = versor.cartesian(projection.rotate(r0).invert(d3.pointers(svg))),
        q1 = versor.multiply(q0, versor.delta(v0, v1)),
        r1 = versor.rotation(q1);
    projection.rotate(r1);
  }

  return d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged);
}