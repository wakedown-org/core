export class Voronoi {
  public cells: Cell[] = [];
  public edges: Edge[] = [];
  public vertices: Vertex[] = [];
  public toRecycle: Diagram | null = null;

  public beachline: RBTree | null = null;
  public circleEvents!: RBTree;
  public firstCircleEvent: CircleEvent | null = null;

  private sqrt = Math.sqrt;
  private abs = Math.abs;
  private ε = 1e-9;
  private invε = 1.0 / this.ε;
  private equalWithEpsilon = (a: number, b: number): boolean => this.abs(a - b) < 1e-9;
  private greaterThanWithEpsilon = (a: number, b: number): boolean => a - b > 1e-9;
  private greaterThanOrEqualWithEpsilon = (a: number, b: number): boolean => b - a < 1e-9;
  private lessThanWithEpsilon = (a: number, b: number): boolean => b - a > 1e-9;
  private lessThanOrEqualWithEpsilon = (a: number, b: number): boolean => a - b < 1e-9;

  public beachsectionJunkyard: Beachsection[] = [];
  public circleEventJunkyard: CircleEvent[] = [];
  public vertexJunkyard: Vertex[] = [];
  public edgeJunkyard: Edge[] = [];
  public cellJunkyard: Cell[] = [];

  reset() {
    if (this.beachline === null) {
      this.beachline = new RBTree();
    }
    // Move leftover beachsections to the beachsection junkyard.
    if (this.beachline.root) {
      var beachsection = this.beachline.getFirst(this.beachline.root);
      while (beachsection) {
        this.beachsectionJunkyard.push(beachsection); // mark for reuse
        beachsection = beachsection.rbNext!;
      }
    }
    this.beachline.root = null;
    if (!this.circleEvents) {
      this.circleEvents = new RBTree();
    }
    this.circleEvents.root = this.firstCircleEvent = null;
    this.vertices = [];
    this.edges = [];
    this.cells = [];
  }

  createCell(site: Vertex): Cell {
    var cell = this.cellJunkyard.pop();
    if (cell) {
      return cell.init(site);
    }
    return new Cell(site);
  }

  createHalfedge(edge: Edge, lSite: Vertex, rSite: Vertex | null): Halfedge {
    return new Halfedge(edge, lSite, rSite!);
  }

  createVertex(x: number, y: number): Vertex {
    var v = this.vertexJunkyard.pop();
    if (!v) {
      v = new Vertex(x, y);
    }
    else {
      v.x = x;
      v.y = y;
    }
    this.vertices.push(v);
    return v;
  }

  createEdge(lSite: Vertex, rSite: Vertex | null, va: Vertex | null = null, vb: Vertex | null = null): Edge {
    var edge = this.edgeJunkyard.pop();
    if (!edge) {
      edge = new Edge(lSite, rSite);
    }
    else {
      edge.lSite = lSite;
      edge.rSite = rSite;
      edge.va = edge.vb = null;
    }

    this.edges.push(edge);
    if (va) {
      this.setEdgeStartpoint(edge, lSite, rSite, va);
    }
    if (vb) {
      this.setEdgeEndpoint(edge, lSite, rSite, vb);
    }
    this.cells[lSite.voronoiId].halfedges.push(this.createHalfedge(edge, lSite, rSite));
    this.cells[rSite!.voronoiId].halfedges.push(this.createHalfedge(edge, rSite!, lSite));
    return edge;
  }

  createBorderEdge(lSite: Vertex, va: Vertex | null, vb: Vertex | null): Edge {
    var edge = this.edgeJunkyard.pop();
    if (!edge) {
      edge = new Edge(lSite, null);
    }
    else {
      edge.lSite = lSite;
      edge.rSite = null;
    }
    edge.va = va;
    edge.vb = vb;
    this.edges.push(edge);
    return edge;
  }

  setEdgeStartpoint(edge: Edge, lSite: Vertex, rSite: Vertex | null, vertex: Vertex) {
    if (!edge.va && !edge.vb) {
      edge.va = vertex;
      edge.lSite = lSite;
      edge.rSite = rSite;
    }
    else if (edge.lSite === rSite) {
      edge.vb = vertex;
    }
    else {
      edge.va = vertex;
    }
  }

  setEdgeEndpoint(edge: Edge, lSite: Vertex, rSite: Vertex | null, vertex: Vertex) {
    this.setEdgeStartpoint(edge, rSite!, lSite, vertex);
  }

  createBeachsection(site: Vertex): Beachsection {
    var beachsection = this.beachsectionJunkyard.pop();
    if (!beachsection) {
      beachsection = new Beachsection();
    }
    beachsection.site = site;
    return beachsection;
  }

  leftBreakPoint(arc: CircleEvent, directrix: number): number {
    // http://en.wikipedia.org/wiki/Parabola
    // http://en.wikipedia.org/wiki/Quadratic_equation
    // h1 = x1,
    // k1 = (y1+directrix)/2,
    // h2 = x2,
    // k2 = (y2+directrix)/2,
    // p1 = k1-directrix,
    // a1 = 1/(4*p1),
    // b1 = -h1/(2*p1),
    // c1 = h1*h1/(4*p1)+k1,
    // p2 = k2-directrix,
    // a2 = 1/(4*p2),
    // b2 = -h2/(2*p2),
    // c2 = h2*h2/(4*p2)+k2,
    // x = (-(b2-b1) + Math.sqrt((b2-b1)*(b2-b1) - 4*(a2-a1)*(c2-c1))) / (2*(a2-a1))
    // When x1 become the x-origin:
    // h1 = 0,
    // k1 = (y1+directrix)/2,
    // h2 = x2-x1,
    // k2 = (y2+directrix)/2,
    // p1 = k1-directrix,
    // a1 = 1/(4*p1),
    // b1 = 0,
    // c1 = k1,
    // p2 = k2-directrix,
    // a2 = 1/(4*p2),
    // b2 = -h2/(2*p2),
    // c2 = h2*h2/(4*p2)+k2,
    // x = (-b2 + Math.sqrt(b2*b2 - 4*(a2-a1)*(c2-k1))) / (2*(a2-a1)) + x1

    // change code below at your own risk: care has been taken to
    // reduce errors due to computers' finite arithmetic precision.
    // Maybe can still be improved, will see if any more of this
    // kind of errors pop up again.
    var site = arc.site,
      rfocx = site!.x,
      rfocy = site!.y,
      pby2 = rfocy - directrix;
    // parabola in degenerate case where focus is on directrix
    if (!pby2) {
      return rfocx;
    }
    var lArc = arc.rbPrevious;
    if (!lArc) {
      return -Infinity;
    }
    site = lArc.site;
    var lfocx = site!.x,
      lfocy = site!.y,
      plby2 = lfocy - directrix;
    // parabola in degenerate case where focus is on directrix
    if (!plby2) {
      return lfocx;
    }
    var hl = lfocx - rfocx,
      aby2 = 1 / pby2 - 1 / plby2,
      b = hl / plby2;
    if (aby2) {
      return (-b + this.sqrt(b * b - 2 * aby2 * (hl * hl / (-2 * plby2) - lfocy + plby2 / 2 + rfocy - pby2 / 2))) / aby2 + rfocx;
    }
    // both parabolas have same distance to directrix, thus break point is midway
    return (rfocx + lfocx) / 2;
  }

  rightBreakPoint(arc: CircleEvent, directrix: number): number {
    var rArc = arc.rbNext;
    if (rArc) {
      return this.leftBreakPoint(rArc, directrix);
    }
    var site = arc.site;
    return site!.y === directrix ? site!.x : Infinity;
  }

  detachBeachsection(beachsection: Beachsection) {
    this.detachCircleEvent(beachsection); // detach potentially attached circle event
    this.beachline!.rbRemoveNode(beachsection); // remove from RB-tree
    this.beachsectionJunkyard.push(beachsection); // mark for reuse
  }

  removeBeachsection(beachsection: Beachsection) {
    var circle = beachsection.circleEvent,
      x = circle!.x,
      y = circle!.ycenter,
      vertex = this.createVertex(x, y),
      previous = beachsection.rbPrevious,
      next = beachsection.rbNext,
      disappearingTransitions = [beachsection],
      abs_fn = Math.abs;

    // remove collapsed beachsection from beachline
    this.detachBeachsection(beachsection);

    // there could be more than one empty arc at the deletion point, this
    // happens when more than two edges are linked by the same vertex,
    // so we will collect all those edges by looking up both sides of
    // the deletion point.
    // by the way, there is *always* a predecessor/successor to any collapsed
    // beach section, it's just impossible to have a collapsing first/last
    // beach sections on the beachline, since they obviously are unconstrained
    // on their left/right side.

    // look left
    var lArc = previous;
    while (lArc!.circleEvent && abs_fn(x - lArc!.circleEvent.x) < 1e-9 && abs_fn(y - lArc!.circleEvent.ycenter) < 1e-9) {
      previous = lArc!.rbPrevious;
      disappearingTransitions.unshift(lArc!);
      this.detachBeachsection(lArc!); // mark for reuse
      lArc = previous;
    }
    // even though it is not disappearing, I will also add the beach section
    // immediately to the left of the left-most collapsed beach section, for
    // convenience, since we need to refer to it later as this beach section
    // is the 'left' site of an edge for which a start point is set.
    disappearingTransitions.unshift(lArc!);
    this.detachCircleEvent(lArc!);

    // look right
    var rArc = next;
    while (rArc!.circleEvent && abs_fn(x - rArc!.circleEvent.x) < 1e-9 && abs_fn(y - rArc!.circleEvent.ycenter) < 1e-9) {
      next = rArc!.rbNext;
      disappearingTransitions.push(rArc!);
      this.detachBeachsection(rArc!); // mark for reuse
      rArc = next;
    }
    // we also have to add the beach section immediately to the right of the
    // right-most collapsed beach section, since there is also a disappearing
    // transition representing an edge's start point on its left.
    disappearingTransitions.push(rArc!);
    this.detachCircleEvent(rArc!);

    // walk through all the disappearing transitions between beach sections and
    // set the start point of their (implied) edge.
    var nArcs = disappearingTransitions.length,
      iArc;
    for (iArc = 1; iArc < nArcs; iArc++) {
      rArc = disappearingTransitions[iArc];
      lArc = disappearingTransitions[iArc - 1];
      this.setEdgeStartpoint(rArc!.edge!, lArc!.site!, rArc.site, vertex);
    }

    // create a new edge as we have now a new transition between
    // two beach sections which were previously not adjacent.
    // since this edge appears as a new vertex is defined, the vertex
    // actually define an end point of the edge (relative to the site
    // on the left)
    lArc = disappearingTransitions[0];
    rArc = disappearingTransitions[nArcs - 1];
    rArc.edge = this.createEdge(lArc!.site!, rArc.site, undefined, vertex);

    // create circle events if any for beach sections left in the beachline
    // adjacent to collapsed sections
    this.attachCircleEvent(lArc);
    this.attachCircleEvent(rArc);
  }

  addBeachsection(site: Vertex) {
    var x = site.x,
      directrix = site.y;

    // find the left and right beach sections which will surround the newly
    // created beach section.
    // rhill 2011-06-01: This loop is one of the most often executed,
    // hence we expand in-place the comparison-against-epsilon calls.
    var lArc: CircleEvent | null, 
      rArc: CircleEvent | null,
      dxl, 
      dxr,
      node = this.beachline!.root;

    while (node) {
      dxl = this.leftBreakPoint(node, directrix) - x;
      // x lessThanWithEpsilon xl => falls somewhere before the left edge of the beachsection
      if (dxl > 1e-9) {
        // this case should never happen
        // if (!node.rbLeft) {
        //    rArc = node.rbLeft;
        //    break;
        //    }
        node = node.rbLeft;
      }
      else {
        dxr = x - this.rightBreakPoint(node, directrix);
        // x greaterThanWithEpsilon xr => falls somewhere after the right edge of the beachsection
        if (dxr > 1e-9) {
          if (!node.rbRight) {
            lArc = node;
            break;
          }
          node = node.rbRight;
        }
        else {
          // x equalWithEpsilon xl => falls exactly on the left edge of the beachsection
          if (dxl > -1e-9) {
            lArc = node.rbPrevious;
            rArc = node;
          }
          // x equalWithEpsilon xr => falls exactly on the right edge of the beachsection
          else if (dxr > -1e-9) {
            lArc = node;
            rArc = node.rbNext;
          }
          // falls exactly somewhere in the middle of the beachsection
          else {
            lArc = rArc = node;
          }
          break;
        }
      }
    }
    // at this point, keep in mind that lArc and/or rArc could be
    // undefined or null.

    // create a new beach section object for the site and add it to RB-tree
    var newArc = this.createBeachsection(site);
    this.beachline!.rbInsertSuccessor(lArc!, newArc);

    // cases:
    //

    // [null,null]
    // least likely case: new beach section is the first beach section on the
    // beachline.
    // This case means:
    //   no new transition appears
    //   no collapsing beach section
    //   new beachsection become root of the RB-tree
    if (!lArc! && !rArc!) {
      return;
    }

    // [lArc,rArc] where lArc == rArc
    // most likely case: new beach section split an existing beach
    // section.
    // This case means:
    //   one new transition appears
    //   the left and right beach section might be collapsing as a result
    //   two new nodes added to the RB-tree
    if (lArc! === rArc!) {
      // invalidate circle event of split beach section
      this.detachCircleEvent(lArc);

      // split the beach section into two separate beach sections
      rArc = this.createBeachsection(lArc!.site!);
      this.beachline!.rbInsertSuccessor(newArc, rArc);

      // since we have a new transition between two beach sections,
      // a new edge is born
      newArc.edge = rArc.edge = this.createEdge(lArc!.site!, newArc.site);

      // check whether the left and right beach sections are collapsing
      // and if so create circle events, to be notified when the point of
      // collapse is reached.
      this.attachCircleEvent(lArc);
      this.attachCircleEvent(rArc);
      return;
    }

    // [lArc,null]
    // even less likely case: new beach section is the *last* beach section
    // on the beachline -- this can happen *only* if *all* the previous beach
    // sections currently on the beachline share the same y value as
    // the new beach section.
    // This case means:
    //   one new transition appears
    //   no collapsing beach section as a result
    //   new beach section become right-most node of the RB-tree
    if (lArc! && !rArc!) {
      newArc.edge = this.createEdge(lArc!.site!, newArc.site);
      return;
    }

    // [null,rArc]
    // impossible case: because sites are strictly processed from top to bottom,
    // and left to right, which guarantees that there will always be a beach section
    // on the left -- except of course when there are no beach section at all on
    // the beach line, which case was handled above.
    // rhill 2011-06-02: No point testing in non-debug version
    //if (!lArc && rArc) {
    //    throw "Voronoi.addBeachsection(): What is this I don't even";
    //    }

    // [lArc,rArc] where lArc != rArc
    // somewhat less likely case: new beach section falls *exactly* in between two
    // existing beach sections
    // This case means:
    //   one transition disappears
    //   two new transitions appear
    //   the left and right beach section might be collapsing as a result
    //   only one new node added to the RB-tree
    if (lArc! !== rArc!) {
      // invalidate circle events of left and right sites
      this.detachCircleEvent(lArc!);
      this.detachCircleEvent(rArc!);

      // an existing transition disappears, meaning a vertex is defined at
      // the disappearance point.
      // since the disappearance is caused by the new beachsection, the
      // vertex is at the center of the circumscribed circle of the left,
      // new and right beachsections.
      // http://mathforum.org/library/drmath/view/55002.html
      // Except that I bring the origin at A to simplify
      // calculation
      var lSite = lArc!.site,
        ax = lSite!.x,
        ay = lSite!.y,
        bx = site.x - ax,
        by = site.y - ay,
        rSite = rArc!.site,
        cx = rSite!.x - ax,
        cy = rSite!.y - ay,
        d = 2 * (bx * cy - by * cx),
        hb = bx * bx + by * by,
        hc = cx * cx + cy * cy,
        vertex = this.createVertex((cy * hb - by * hc) / d + ax, (bx * hc - cx * hb) / d + ay);

      // one transition disappear
      this.setEdgeStartpoint(rArc!.edge!, lSite!, rSite, vertex);

      // two new transitions appear at the new vertex location
      newArc.edge = this.createEdge(lSite!, site, undefined, vertex);
      rArc!.edge = this.createEdge(site, rSite, undefined, vertex);

      // check whether the left and right beach sections are collapsing
      // and if so create circle events, to handle the point of collapse.
      this.attachCircleEvent(lArc!);
      this.attachCircleEvent(rArc!);
      return;
    }
  }

  attachCircleEvent(arc: CircleEvent) {
    var lArc = arc.rbPrevious,
      rArc = arc.rbNext;
    if (!lArc || !rArc) { return; } // does that ever happen?
    var lSite = lArc.site,
      cSite = arc.site,
      rSite = rArc.site;

    // If site of left beachsection is same as site of
    // right beachsection, there can't be convergence
    if (lSite === rSite) { return; }

    // Find the circumscribed circle for the three sites associated
    // with the beachsection triplet.
    // rhill 2011-05-26: It is more efficient to calculate in-place
    // rather than getting the resulting circumscribed circle from an
    // object returned by calling Voronoi.circumcircle()
    // http://mathforum.org/library/drmath/view/55002.html
    // Except that I bring the origin at cSite to simplify calculations.
    // The bottom-most part of the circumcircle is our Fortune 'circle
    // event', and its center is a vertex potentially part of the final
    // Voronoi diagram.
    var bx = cSite!.x,
      by = cSite!.y,
      ax = lSite!.x - bx,
      ay = lSite!.y - by,
      cx = rSite!.x - bx,
      cy = rSite!.y - by;

    // If points l->c->r are clockwise, then center beach section does not
    // collapse, hence it can't end up as a vertex (we reuse 'd' here, which
    // sign is reverse of the orientation, hence we reverse the test.
    // http://en.wikipedia.org/wiki/Curve_orientation#Orientation_of_a_simple_polygon
    // rhill 2011-05-21: Nasty finite precision error which caused circumcircle() to
    // return infinites: 1e-12 seems to fix the problem.
    var d = 2 * (ax * cy - ay * cx);
    if (d >= -2e-12) { return; }

    var ha = ax * ax + ay * ay,
      hc = cx * cx + cy * cy,
      x = (cy * ha - ay * hc) / d,
      y = (ax * hc - cx * ha) / d,
      ycenter = y + by;

    // Important: ybottom should always be under or at sweep, so no need
    // to waste CPU cycles by checking

    // recycle circle event object if possible
    var circleEvent = this.circleEventJunkyard.pop();
    if (!circleEvent) {
      circleEvent = new CircleEvent();
    }
    circleEvent.arc = arc;
    circleEvent.site = cSite;
    circleEvent.x = x + bx;
    circleEvent.y = ycenter + this.sqrt(x * x + y * y); // y bottom
    circleEvent.ycenter = ycenter;
    arc.circleEvent = circleEvent;

    // find insertion point in RB-tree: circle events are ordered from
    // smallest to largest
    var predecessor = null,
      node = this.circleEvents.root;
    while (node) {
      if (circleEvent.y < node.y || (circleEvent.y === node.y && circleEvent.x <= node.x)) {
        if (node.rbLeft) {
          node = node.rbLeft;
        }
        else {
          predecessor = node.rbPrevious;
          break;
        }
      }
      else {
        if (node.rbRight) {
          node = node.rbRight;
        }
        else {
          predecessor = node;
          break;
        }
      }
    }
    this.circleEvents.rbInsertSuccessor(predecessor!, circleEvent);
    if (!predecessor) {
      this.firstCircleEvent = circleEvent;
    }
  }

  detachCircleEvent(arc: CircleEvent) {
    var circleEvent = arc.circleEvent;
    if (circleEvent) {
      if (!circleEvent.rbPrevious) {
        this.firstCircleEvent = circleEvent.rbNext;
      }
      this.circleEvents.rbRemoveNode(circleEvent); // remove from RB-tree
      this.circleEventJunkyard.push(circleEvent);
      arc.circleEvent = null;
    }
  }

  connectEdge(edge: Edge, bbox: { xl: number, xr: number, yt: number, yb: number }) {
    // skip if end point already connected
    var vb = edge.vb;
    if (!!vb) { return true; }

    // make local copy for performance purpose
    var va = edge.va,
      xl = bbox.xl,
      xr = bbox.xr,
      yt = bbox.yt,
      yb = bbox.yb,
      lSite = edge.lSite,
      rSite = edge.rSite,
      lx = lSite.x,
      ly = lSite.y,
      rx = rSite!.x,
      ry = rSite!.y,
      fx = (lx + rx) / 2,
      fy = (ly + ry) / 2,
      fm = 0, 
      fb = 0;

    // if we reach here, this means cells which use this edge will need
    // to be closed, whether because the edge was removed, or because it
    // was connected to the bounding box.
    this.cells[lSite.voronoiId].closeMe = true;
    this.cells[rSite!.voronoiId].closeMe = true;

    // get the line equation of the bisector if line is not vertical
    if (ry !== ly) {
      fm = (lx - rx) / (ry - ly);
      fb = fy - fm * fx;
    }

    // remember, direction of line (relative to left site):
    // upward: left.x < right.x
    // downward: left.x > right.x
    // horizontal: left.x == right.x
    // upward: left.x < right.x
    // rightward: left.y < right.y
    // leftward: left.y > right.y
    // vertical: left.y == right.y

    // depending on the direction, find the best side of the
    // bounding box to use to determine a reasonable start point

    // rhill 2013-12-02:
    // While at it, since we have the values which define the line,
    // clip the end of va if it is outside the bbox.
    // https://github.com/gorhill/Javascript-Voronoi/issues/15
    // TODO: Do all the clipping here rather than rely on Liang-Barsky
    // which does not do well sometimes due to loss of arithmetic
    // precision. The code here doesn't degrade if one of the vertex is
    // at a huge distance.

    // special case: vertical line
    if (fm === undefined) {
      // doesn't intersect with viewport
      if (fx < xl || fx >= xr) { return false; }
      // downward
      if (lx > rx) {
        if (!va || va.y < yt) {
          va = this.createVertex(fx, yt);
        }
        else if (va.y >= yb) {
          return false;
        }
        vb = this.createVertex(fx, yb);
      }
      // upward
      else {
        if (!va || va.y > yb) {
          va = this.createVertex(fx, yb);
        }
        else if (va.y < yt) {
          return false;
        }
        vb = this.createVertex(fx, yt);
      }
    }
    // closer to vertical than horizontal, connect start point to the
    // top or bottom side of the bounding box
    else if (fm < -1 || fm > 1) {
      // downward
      if (lx > rx) {
        if (!va || va.y < yt) {
          va = this.createVertex((yt - fb) / fm, yt);
        }
        else if (va.y >= yb) {
          return false;
        }
        vb = this.createVertex((yb - fb) / fm, yb);
      }
      // upward
      else {
        if (!va || va.y > yb) {
          va = this.createVertex((yb - fb) / fm, yb);
        }
        else if (va.y < yt) {
          return false;
        }
        vb = this.createVertex((yt - fb) / fm, yt);
      }
    }
    // closer to horizontal than vertical, connect start point to the
    // left or right side of the bounding box
    else {
      // rightward
      if (ly < ry) {
        if (!va || va.x < xl) {
          va = this.createVertex(xl, fm * xl + fb);
        }
        else if (va.x >= xr) {
          return false;
        }
        vb = this.createVertex(xr, fm * xr + fb);
      }
      // leftward
      else {
        if (!va || va.x > xr) {
          va = this.createVertex(xr, fm * xr + fb);
        }
        else if (va.x < xl) {
          return false;
        }
        vb = this.createVertex(xl, fm * xl + fb);
      }
    }
    edge.va = va;
    edge.vb = vb;

    return true;
  }

  clipEdge(edge: Edge, bbox: { xl: number, xr: number, yt: number, yb: number }) {
    var ax = edge.va!.x,
      ay = edge.va!.y,
      bx = edge.vb!.x,
      by = edge.vb!.y,
      t0 = 0,
      t1 = 1,
      dx = bx - ax,
      dy = by - ay;
    // left
    var q = ax - bbox.xl;
    if (dx === 0 && q < 0) { return false; }
    var r = -q / dx;
    if (dx < 0) {
      if (r < t0) { return false; }
      if (r < t1) { t1 = r; }
    }
    else if (dx > 0) {
      if (r > t1) { return false; }
      if (r > t0) { t0 = r; }
    }
    // right
    q = bbox.xr - ax;
    if (dx === 0 && q < 0) { return false; }
    r = q / dx;
    if (dx < 0) {
      if (r > t1) { return false; }
      if (r > t0) { t0 = r; }
    }
    else if (dx > 0) {
      if (r < t0) { return false; }
      if (r < t1) { t1 = r; }
    }
    // top
    q = ay - bbox.yt;
    if (dy === 0 && q < 0) { return false; }
    r = -q / dy;
    if (dy < 0) {
      if (r < t0) { return false; }
      if (r < t1) { t1 = r; }
    }
    else if (dy > 0) {
      if (r > t1) { return false; }
      if (r > t0) { t0 = r; }
    }
    // bottom        
    q = bbox.yb - ay;
    if (dy === 0 && q < 0) { return false; }
    r = q / dy;
    if (dy < 0) {
      if (r > t1) { return false; }
      if (r > t0) { t0 = r; }
    }
    else if (dy > 0) {
      if (r < t0) { return false; }
      if (r < t1) { t1 = r; }
    }

    // if we reach this point, Voronoi edge is within bbox

    // if t0 > 0, va needs to change
    // rhill 2011-06-03: we need to create a new vertex rather
    // than modifying the existing one, since the existing
    // one is likely shared with at least another edge
    if (t0 > 0) {
      edge.va = this.createVertex(ax + t0 * dx, ay + t0 * dy);
    }

    // if t1 < 1, vb needs to change
    // rhill 2011-06-03: we need to create a new vertex rather
    // than modifying the existing one, since the existing
    // one is likely shared with at least another edge
    if (t1 < 1) {
      edge.vb = this.createVertex(ax + t1 * dx, ay + t1 * dy);
    }

    // va and/or vb were clipped, thus we will need to close
    // cells which use this edge.
    if (t0 > 0 || t1 < 1) {
      this.cells[edge.lSite.voronoiId].closeMe = true;
      this.cells[edge.rSite!.voronoiId].closeMe = true;
    }

    return true;
  }

  clipEdges(bbox: { xl: number, xr: number, yt: number, yb: number }) {
    // connect all dangling edges to bounding box
    // or get rid of them if it can't be done
    var edges = this.edges,
      iEdge = edges.length,
      edge,
      abs_fn = Math.abs;

    // iterate backward so we can splice safely
    while (iEdge--) {
      edge = edges[iEdge];
      // edge is removed if:
      //   it is wholly outside the bounding box
      //   it is looking more like a point than a line
      if (!this.connectEdge(edge, bbox) ||
        !this.clipEdge(edge, bbox) ||
        (abs_fn(edge.va!.x - edge.vb!.x) < 1e-9 && abs_fn(edge.va!.y - edge.vb!.y) < 1e-9)) {
        edge.va = edge.vb = null;
        edges.splice(iEdge, 1);
      }
    }
  }

  closeCells(bbox: { xl: number, xr: number, yt: number, yb: number }) {
    var xl = bbox.xl,
      xr = bbox.xr,
      yt = bbox.yt,
      yb = bbox.yb,
      cells = this.cells,
      iCell = cells.length,
      cell,
      iLeft,
      halfedges, nHalfedges,
      edge,
      va, vb, vz,
      lastBorderSegment,
      abs_fn = Math.abs;

    while (iCell--) {
      cell = cells[iCell];
      // prune, order halfedges counterclockwise, then add missing ones
      // required to close cells
      if (!cell.prepareHalfedges()) {
        continue;
      }
      if (!cell.closeMe) {
        continue;
      }
      // find first 'unclosed' point.
      // an 'unclosed' point will be the end point of a halfedge which
      // does not match the start point of the following halfedge
      halfedges = cell.halfedges;
      nHalfedges = halfedges.length;
      // special case: only one site, in which case, the viewport is the cell
      // ...

      // all other cases
      iLeft = 0;
      while (iLeft < nHalfedges) {
        va = halfedges[iLeft].getEndpoint();
        vz = halfedges[(iLeft + 1) % nHalfedges].getStartpoint();
        // if end point is not equal to start point, we need to add the missing
        // halfedge(s) up to vz
        if (abs_fn(va!.x - vz!.x) >= 1e-9 || abs_fn(va!.y - vz!.y) >= 1e-9) {

          // rhill 2013-12-02:
          // "Holes" in the halfedges are not necessarily always adjacent.
          // https://github.com/gorhill/Javascript-Voronoi/issues/16

          // find entry point:
          switch (true) {

            // walk downward along left side
            case this.equalWithEpsilon(va!.x, xl) && this.lessThanWithEpsilon(va!.y, yb):
              lastBorderSegment = this.equalWithEpsilon(vz!.x, xl);
              vb = this.createVertex(xl, lastBorderSegment ? vz!.y : yb);
              edge = this.createBorderEdge(cell.site, va, vb);
              iLeft++;
              halfedges.splice(iLeft, 0, this.createHalfedge(edge, cell.site, null));
              nHalfedges++;
              if (lastBorderSegment) { break; }
              va = vb;
            // fall through

            // walk rightward along bottom side
            case this.equalWithEpsilon(va!.y, yb) && this.lessThanWithEpsilon(va!.x, xr):
              lastBorderSegment = this.equalWithEpsilon(vz!.y, yb);
              vb = this.createVertex(lastBorderSegment ? vz!.x : xr, yb);
              edge = this.createBorderEdge(cell.site, va, vb);
              iLeft++;
              halfedges.splice(iLeft, 0, this.createHalfedge(edge, cell.site, null));
              nHalfedges++;
              if (lastBorderSegment) { break; }
              va = vb;
            // fall through

            // walk upward along right side
            case this.equalWithEpsilon(va!.x, xr) && this.greaterThanWithEpsilon(va!.y, yt):
              lastBorderSegment = this.equalWithEpsilon(vz!.x, xr);
              vb = this.createVertex(xr, lastBorderSegment ? vz!.y : yt);
              edge = this.createBorderEdge(cell.site, va, vb);
              iLeft++;
              halfedges.splice(iLeft, 0, this.createHalfedge(edge, cell.site, null));
              nHalfedges++;
              if (lastBorderSegment) { break; }
              va = vb;
            // fall through

            // walk leftward along top side
            case this.equalWithEpsilon(va!.y, yt) && this.greaterThanWithEpsilon(va!.x, xl):
              lastBorderSegment = this.equalWithEpsilon(vz!.y, yt);
              vb = this.createVertex(lastBorderSegment ? vz!.x : xl, yt);
              edge = this.createBorderEdge(cell.site, va, vb);
              iLeft++;
              halfedges.splice(iLeft, 0, this.createHalfedge(edge, cell.site, null));
              nHalfedges++;
              if (lastBorderSegment) { break; }
              va = vb;
              // fall through

              // walk downward along left side
              lastBorderSegment = this.equalWithEpsilon(vz!.x, xl);
              vb = this.createVertex(xl, lastBorderSegment ? vz!.y : yb);
              edge = this.createBorderEdge(cell.site, va, vb);
              iLeft++;
              halfedges.splice(iLeft, 0, this.createHalfedge(edge, cell.site, null));
              nHalfedges++;
              if (lastBorderSegment) { break; }
              va = vb;
              // fall through

              // walk rightward along bottom side
              lastBorderSegment = this.equalWithEpsilon(vz!.y, yb);
              vb = this.createVertex(lastBorderSegment ? vz!.x : xr, yb);
              edge = this.createBorderEdge(cell.site, va, vb);
              iLeft++;
              halfedges.splice(iLeft, 0, this.createHalfedge(edge, cell.site, null));
              nHalfedges++;
              if (lastBorderSegment) { break; }
              va = vb;
              // fall through

              // walk upward along right side
              lastBorderSegment = this.equalWithEpsilon(vz!.x, xr);
              vb = this.createVertex(xr, lastBorderSegment ? vz!.y : yt);
              edge = this.createBorderEdge(cell.site, va, vb);
              iLeft++;
              halfedges.splice(iLeft, 0, this.createHalfedge(edge, cell.site, null));
              nHalfedges++;
              if (lastBorderSegment) { break; }
            // fall through

            default:
              throw "Voronoi.closeCells() > this makes no sense!";
          }
        }
        iLeft++;
      }
      cell.closeMe = false;
    }
  }

  quantizeSites(sites: Vertex[]) {
    var ε = this.ε,
      n = sites.length,
      site;
    while (n--) {
      site = sites[n];
      site.x = Math.floor(site.x / ε) * ε;
      site.y = Math.floor(site.y / ε) * ε;
    }
  }

  recycle(diagram: Diagram) {
    if (diagram) {
      if (diagram instanceof Diagram) {
        this.toRecycle = diagram;
      }
      else {
        throw 'Voronoi.recycleDiagram() > Need a Diagram object.';
      }
    }
  }
}

export class Vertex {
  public voronoiId: number = -1;
  constructor(public x: number, public y: number) { }
}

export class Edge {
  constructor(
    public lSite: Vertex,
    public rSite: Vertex | null,
    public va: Vertex | null = null,
    public vb: Vertex | null = null) { }
}

export class Halfedge {
  public site: Vertex;
  public angle: number;

  constructor(public edge: Edge, lSite: Vertex, rSite: Vertex) {
    this.site = lSite;
    this.edge = edge;
    // 'angle' is a value to be used for properly sorting the
    // halfsegments counterclockwise. By convention, we will
    // use the angle of the line defined by the 'site to the left'
    // to the 'site to the right'.
    // However, border edges have no 'site to the right': thus we
    // use the angle of line perpendicular to the halfsegment (the
    // edge should have both end points defined in such case.)
    if (rSite) {
      this.angle = Math.atan2(rSite.y - lSite.y, rSite.x - lSite.x);
    }
    else {
      var va = edge.va,
        vb = edge.vb;
      // rhill 2011-05-31: used to call getStartpoint()/getEndpoint(),
      // but for performance purpose, these are expanded in place here.
      this.angle = edge.lSite === lSite ?
        Math.atan2(vb!.x - va!.x, va!.y - vb!.y) :
        Math.atan2(va!.x - vb!.x, vb!.y - va!.y);
    }
  }

  getStartpoint() {
    return this.edge.lSite === this.site ? this.edge.va : this.edge.vb;
  }

  getEndpoint() {
    return this.edge.lSite === this.site ? this.edge.vb : this.edge.va;
  }
}

export class Cell {
  public halfedges: Halfedge[] = [];
  public closeMe = false;

  constructor(public site: Vertex) { }

  init(site: Vertex) {
    this.site = site;
    this.halfedges = [];
    this.closeMe = false;
    return this;
  }

  prepareHalfedges() {
    var halfedges = this.halfedges,
      iHalfedge = halfedges.length,
      edge;
    // get rid of unused halfedges
    // rhill 2011-05-27: Keep it simple, no point here in trying
    // to be fancy: dangling edges are a typically a minority.
    while (iHalfedge--) {
      edge = halfedges[iHalfedge].edge;
      if (!edge.vb || !edge.va) {
        halfedges.splice(iHalfedge, 1);
      }
    }

    // rhill 2011-05-26: I tried to use a binary search at insertion
    // time to keep the array sorted on-the-fly (in Cell.addHalfedge()).
    // There was no real benefits in doing so, performance on
    // Firefox 3.6 was improved marginally, while performance on
    // Opera 11 was penalized marginally.
    halfedges.sort((a, b) => b.angle - a.angle);
    return halfedges.length;
  }

  getNeighborIds() {
    var neighbors = [],
      iHalfedge = this.halfedges.length,
      edge;
    while (iHalfedge--) {
      edge = this.halfedges[iHalfedge].edge;
      if (edge.lSite !== null && edge.lSite.voronoiId != this.site.voronoiId) {
        neighbors.push(edge.lSite.voronoiId);
      }
      else if (edge.rSite !== null && edge.rSite.voronoiId != this.site.voronoiId) {
        neighbors.push(edge.rSite.voronoiId);
      }
    }
    return neighbors;
  }

  getBbox() {
    var halfedges = this.halfedges,
      iHalfedge = halfedges.length,
      xmin = Infinity,
      ymin = Infinity,
      xmax = -Infinity,
      ymax = -Infinity,
      v, vx, vy;
    while (iHalfedge--) {
      v = halfedges[iHalfedge].getStartpoint();
      vx = v!.x;
      vy = v!.y;
      if (vx < xmin) { xmin = vx; }
      if (vy < ymin) { ymin = vy; }
      if (vx > xmax) { xmax = vx; }
      if (vy > ymax) { ymax = vy; }
      // we dont need to take into account end point,
      // since each end point matches a start point
    }
    return {
      x: xmin,
      y: ymin,
      width: xmax - xmin,
      height: ymax - ymin
    };
  }

  pointIntersection(x: number, y: number) {
    // Check if point in polygon. Since all polygons of a Voronoi
    // diagram are convex, then:
    // http://paulbourke.net/geometry/polygonmesh/
    // Solution 3 (2D):
    //   "If the polygon is convex then one can consider the polygon
    //   "as a 'path' from the first vertex. A point is on the interior
    //   "of this polygons if it is always on the same side of all the
    //   "line segments making up the path. ...
    //   "(y - y0) (x1 - x0) - (x - x0) (y1 - y0)
    //   "if it is less than 0 then P is to the right of the line segment,
    //   "if greater than 0 it is to the left, if equal to 0 then it lies
    //   "on the line segment"
    var halfedges = this.halfedges,
      iHalfedge = halfedges.length,
      halfedge,
      p0, p1, r;
    while (iHalfedge--) {
      halfedge = halfedges[iHalfedge];
      p0 = halfedge.getStartpoint();
      p1 = halfedge.getEndpoint();
      r = (y - p0!.y) * (p1!.x - p0!.x) - (x - p0!.x) * (p1!.y - p0!.y);
      if (!r) {
        return 0;
      }
      if (r > 0) {
        return -1;
      }
    }
    return 1;
    // Return whether a point is inside, on, or outside the cell:
    //   -1: point is outside the perimeter of the cell
    //    0: point is on the perimeter of the cell
    //    1: point is inside the perimeter of the cell
    //
  }
}

export class CircleEvent {
  public circleEvent: CircleEvent | null = null;
  public arc: CircleEvent | null = null;
  public rbLeft: CircleEvent | null = null;
  public rbNext: CircleEvent | null = null;
  public rbParent: CircleEvent | null = null;
  public rbPrevious: CircleEvent | null = null;
  public rbRight: CircleEvent | null = null;
  public site: Vertex | null = null;
  public edge: Edge | null = null;
  public rbRed: boolean = false;
  public x: number = 0;
  public y: number = 0;
  public ycenter: number = 0;
}

export class Beachsection extends CircleEvent {

}

export class Diagram {
  constructor(public site: Vertex | null = null) { }
  public cells: Cell[] | null = null;
  public edges: Edge[] | null = null;
  public vertices: Vertex[] | null = null;
  public execTime: number = 0;
}

export class RBTree {
  public root: CircleEvent | null = null;

  rbInsertSuccessor(node: CircleEvent, successor: CircleEvent) {
    var parent;
    if (node) {
      // >>> rhill 2011-05-27: Performance: cache previous/next nodes
      successor.rbPrevious = node;
      successor.rbNext = node.rbNext;
      if (node.rbNext) {
        node.rbNext.rbPrevious = successor;
      }
      node.rbNext = successor;
      // <<<
      if (node.rbRight) {
        // in-place expansion of node.rbRight.getFirst();
        node = node.rbRight;
        while (node.rbLeft) { node = node.rbLeft; }
        node.rbLeft = successor;
      }
      else {
        node.rbRight = successor;
      }
      parent = node;
    }
    // rhill 2011-06-07: if node is null, successor must be inserted
    // to the left-most part of the tree
    else if (this.root) {
      node = this.getFirst(this.root);
      // >>> Performance: cache previous/next nodes
      successor.rbPrevious = null;
      successor.rbNext = node;
      node.rbPrevious = successor;
      // <<<
      node.rbLeft = successor;
      parent = node;
    }
    else {
      // >>> Performance: cache previous/next nodes
      successor.rbPrevious = successor.rbNext = null;
      // <<<
      this.root = successor;
      parent = null;
    }
    successor.rbLeft = successor.rbRight = null;
    successor.rbParent = parent;
    successor.rbRed = true;
    // Fixup the modified tree by recoloring nodes and performing
    // rotations (2 at most) hence the red-black tree properties are
    // preserved.
    var grandpa, uncle;
    node = successor;
    while (parent && parent.rbRed) {
      grandpa = parent.rbParent;
      if (parent === grandpa!.rbLeft) {
        uncle = grandpa!.rbRight;
        if (uncle && uncle.rbRed) {
          parent.rbRed = uncle.rbRed = false;
          grandpa!.rbRed = true;
          node = grandpa!;
        }
        else {
          if (node === parent.rbRight) {
            this.rbRotateLeft(parent);
            node = parent;
            parent = node.rbParent;
          }
          parent!.rbRed = false;
          grandpa!.rbRed = true;
          this.rbRotateRight(grandpa!);
        }
      }
      else {
        uncle = grandpa!.rbLeft;
        if (uncle && uncle.rbRed) {
          parent.rbRed = uncle.rbRed = false;
          grandpa!.rbRed = true;
          node = grandpa!;
        }
        else {
          if (node === parent.rbLeft) {
            this.rbRotateRight(parent);
            node = parent;
            parent = node.rbParent;
          }
          parent!.rbRed = false;
          grandpa!.rbRed = true;
          this.rbRotateLeft(grandpa!);
        }
      }
      parent = node.rbParent;
    }
    this.root!.rbRed = false;
  }

  rbRemoveNode(node: CircleEvent) {
    // >>> rhill 2011-05-27: Performance: cache previous/next nodes
    if (node.rbNext) {
      node.rbNext.rbPrevious = node.rbPrevious;
    }
    if (node.rbPrevious) {
      node.rbPrevious.rbNext = node.rbNext;
    }
    node.rbNext = node.rbPrevious = null;
    // <<<
    var parent = node.rbParent,
      left = node.rbLeft,
      right = node.rbRight,
      next;
    if (!left) {
      next = right;
    }
    else if (!right) {
      next = left;
    }
    else {
      next = this.getFirst(right);
    }
    if (parent) {
      if (parent.rbLeft === node) {
        parent.rbLeft = next;
      }
      else {
        parent.rbRight = next;
      }
    }
    else {
      this.root = next;
    }
    // enforce red-black rules
    var isRed;
    if (left && right) {
      isRed = next!.rbRed;
      next!.rbRed = node.rbRed;
      next!.rbLeft = left;
      left.rbParent = next;
      if (next !== right) {
        parent = next!.rbParent;
        next!.rbParent = node.rbParent;
        node = next!.rbRight!;
        parent!.rbLeft = node;
        next!.rbRight = right;
        right.rbParent = next;
      }
      else {
        next.rbParent = parent;
        parent = next;
        node = next.rbRight!;
      }
    }
    else {
      isRed = node.rbRed;
      node = next!;
    }
    // 'node' is now the sole successor's child and 'parent' its
    // new parent (since the successor can have been moved)
    if (node) {
      node.rbParent = parent;
    }
    // the 'easy' cases
    if (isRed) { return; }
    if (node && node.rbRed) {
      node.rbRed = false;
      return;
    }
    // the other cases
    var sibling;
    do {
      if (node === this.root) {
        break;
      }
      if (node === parent!.rbLeft) {
        sibling = parent!.rbRight;
        if (sibling!.rbRed) {
          sibling!.rbRed = false;
          parent!.rbRed = true;
          this.rbRotateLeft(parent!);
          sibling = parent!.rbRight;
        }
        if ((sibling!.rbLeft && sibling!.rbLeft.rbRed) || (sibling!.rbRight && sibling!.rbRight.rbRed)) {
          if (!sibling!.rbRight || !sibling!.rbRight.rbRed) {
            sibling!.rbLeft!.rbRed = false;
            sibling!.rbRed = true;
            this.rbRotateRight(sibling!);
            sibling = parent!.rbRight;
          }
          sibling!.rbRed = parent!.rbRed;
          parent!.rbRed = sibling!.rbRight!.rbRed = false;
          this.rbRotateLeft(parent!);
          node = this.root!;
          break;
        }
      }
      else {
        sibling = parent!.rbLeft;
        if (sibling!.rbRed) {
          sibling!.rbRed = false;
          parent!.rbRed = true;
          this.rbRotateRight(parent!);
          sibling = parent!.rbLeft;
        }
        if ((sibling!.rbLeft && sibling!.rbLeft.rbRed) || (sibling!.rbRight && sibling!.rbRight.rbRed)) {
          if (!sibling!.rbLeft || !sibling!.rbLeft.rbRed) {
            sibling!.rbRight!.rbRed = false;
            sibling!.rbRed = true;
            this.rbRotateLeft(sibling!);
            sibling = parent!.rbLeft;
          }
          sibling!.rbRed = parent!.rbRed;
          parent!.rbRed = sibling!.rbLeft!.rbRed = false;
          this.rbRotateRight(parent!);
          node = this.root!;
          break;
        }
      }
      sibling!.rbRed = true;
      node = parent!;
      parent = parent!.rbParent;
    } while (!node.rbRed);
    if (node) { node.rbRed = false; }
  }

  rbRotateLeft(node: CircleEvent) {
    var p = node,
      q = node.rbRight, // can't be null
      parent = p.rbParent;
    if (parent) {
      if (parent.rbLeft === p) {
        parent.rbLeft = q;
      }
      else {
        parent.rbRight = q;
      }
    }
    else {
      this.root = q;
    }
    q!.rbParent = parent;
    p.rbParent = q;
    p.rbRight = q!.rbLeft;
    if (p.rbRight) {
      p.rbRight.rbParent = p;
    }
    q!.rbLeft = p;
  }

  rbRotateRight(node: CircleEvent) {
    var p = node,
      q = node.rbLeft, // can't be null
      parent = p.rbParent;
    if (parent) {
      if (parent.rbLeft === p) {
        parent.rbLeft = q;
      }
      else {
        parent.rbRight = q;
      }
    }
    else {
      this.root = q;
    }
    q!.rbParent = parent;
    p.rbParent = q;
    p.rbLeft = q!.rbRight;
    if (p.rbLeft) {
      p.rbLeft.rbParent = p;
    }
    q!.rbRight = p;
  }

  getFirst(node: CircleEvent): CircleEvent {
    while (node.rbLeft) {
      node = node.rbLeft;
    }
    return node;
  }

  getLast(node: CircleEvent): CircleEvent {
    while (node.rbRight) {
      node = node.rbRight;
    }
    return node;
  }
}