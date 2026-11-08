import * as THREE from "three";

const containment = (point, polygon) => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i].uv,
      b = polygon[j].uv;
    if (
      a.y > point.y !== b.y > point.y &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x
    )
      inside = !inside;
  }
  return inside;
};

// A closed indexed mesh intersects a plane in rings. Each crossing edge is
// shared by two triangles, so its ID connects segments without fuzzy welding.
export function createContourReader(geometry) {
  const positions = geometry.getAttribute("position").array;
  const indices = geometry.index.array;
  const count = positions.length / 3;
  const distances = new Float64Array(count);
  const u = new THREE.Vector3(),
    v = new THREE.Vector3();

  return (plane) => {
    const { x, y, z } = plane.normal;
    // Keep exact hits at vertices on the retained side to avoid zero-length edges.
    const offset = plane.constant + 1e-9;
    for (let i = 0, k = 0; i < count; i++, k += 3)
      distances[i] =
        positions[k] * x + positions[k + 1] * y + positions[k + 2] * z + offset;

    u.set(Math.abs(y) > 0.85 ? 1 : 0, Math.abs(y) > 0.85 ? 0 : 1, 0)
      .cross(plane.normal)
      .normalize();
    v.crossVectors(plane.normal, u);
    const crossings = new Map();
    function vertex(a, b) {
      const key = Math.min(a, b) * count + Math.max(a, b);
      const existing = crossings.get(key);
      if (existing) return existing;
      const t = distances[a] / (distances[a] - distances[b]);
      const point = new THREE.Vector3(
        THREE.MathUtils.lerp(positions[a * 3], positions[b * 3], t),
        THREE.MathUtils.lerp(positions[a * 3 + 1], positions[b * 3 + 1], t),
        THREE.MathUtils.lerp(positions[a * 3 + 2], positions[b * 3 + 2], t),
      ).addScaledVector(plane.normal, 1e-9);
      const node = {
        point,
        uv: new THREE.Vector2(point.dot(u), point.dot(v)),
        neighbors: [],
        seen: false,
      };
      crossings.set(key, node);
      return node;
    }
    for (let i = 0; i < indices.length; i += 3) {
      const a = indices[i],
        b = indices[i + 1],
        c = indices[i + 2];
      const sa = distances[a] >= 0,
        sb = distances[b] >= 0,
        sc = distances[c] >= 0;
      if (sa === sb && sb === sc) continue;
      let first, second;
      if (sa === sb) {
        first = vertex(c, a);
        second = vertex(c, b);
      } else if (sa === sc) {
        first = vertex(b, a);
        second = vertex(b, c);
      } else {
        first = vertex(a, b);
        second = vertex(a, c);
      }
      first.neighbors.push(second);
      second.neighbors.push(first);
    }

    const rings = [];
    for (const seed of crossings.values()) {
      if (seed.seen) continue;
      const ring = [];
      let previous,
        node = seed;
      while (node && !node.seen && node.neighbors.length === 2) {
        node.seen = true;
        ring.push(node);
        const next = node.neighbors.find((neighbor) => neighbor !== previous);
        previous = node;
        node = next;
      }
      if (node !== seed || ring.length < 3) continue;
      const area = Math.abs(THREE.ShapeUtils.area(ring.map((item) => item.uv)));
      if (area > 1e-14)
        rings.push({ ring, area, depth: 0, parent: null, holes: [] });
    }

    // A cavity is an odd-depth ring. A solid island inside it starts a new face.
    rings.sort((a, b) => b.area - a.area);
    for (let i = 0; i < rings.length; i++) {
      const item = rings[i];
      for (let j = i - 1; j >= 0; j--) {
        const parent = rings[j];
        if (!containment(item.ring[0].uv, parent.ring)) continue;
        item.parent = parent;
        item.depth = parent.depth + 1;
        if (item.depth % 2 === 1) parent.holes.push(item.ring);
        break;
      }
    }
    const points = [],
      faces = [];
    for (const { depth, ring, holes } of rings) {
      if (depth % 2) continue;
      const outline = ring.map((item) => item.uv);
      const voids = holes.map((hole) => hole.map((item) => item.uv));
      const triangles = THREE.ShapeUtils.triangulateShape(outline, voids);
      const vertices = [ring, ...holes].flat();
      const start = points.length;
      for (const node of vertices) points.push(node.point);
      for (const [a, b, c] of triangles) {
        const p = vertices[a].uv,
          q = vertices[b].uv,
          r = vertices[c].uv;
        const forward =
          (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x) > 0;
        faces.push(
          start + a,
          start + (forward ? c : b),
          start + (forward ? b : c),
        );
      }
    }
    return { points, faces };
  };
}
