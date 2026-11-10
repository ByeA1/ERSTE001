import { BufferAttribute, BufferGeometry, Vector3 } from "three";

// NX's irregular triangles can share a vertex between a large face and a thin
// fillet. Weight by corner angle so triangle area doesn't dominate the normal.
export function createSurfaceGeometry(geometry) {
  const { position } = geometry.attributes;
  const index = geometry.index;
  const faceNormals = new Float32Array(index.count);
  const angles = new Float32Array(index.count);
  const firstCorner = new Int32Array(position.count).fill(-1);
  const nextCorner = new Int32Array(index.count);
  const corners = [new Vector3(), new Vector3(), new Vector3()];
  const face = new Vector3(),
    edge = new Vector3(),
    other = new Vector3();
  const vertices = [0, 0, 0];
  for (let i = 0; i < index.count; i += 3) {
    for (let k = 0; k < 3; k++) {
      vertices[k] = index.getX(i + k);
      corners[k].fromBufferAttribute(position, vertices[k]);
    }
    edge.subVectors(corners[1], corners[0]);
    other.subVectors(corners[2], corners[0]);
    face.crossVectors(edge, other);
    face.normalize();
    face.toArray(faceNormals, i);
    for (let k = 0; k < 3; k++) {
      edge.subVectors(corners[(k + 1) % 3], corners[k]);
      other.subVectors(corners[(k + 2) % 3], corners[k]);
      const corner = i + k;
      angles[corner] = edge.angleTo(other);
      nextCorner[corner] = firstCorner[vertices[k]];
      firstCorner[vertices[k]] = corner;
    }
  }

  // Split render vertices at sharp bends. The original welded indices stay
  // available for section contours, where coincident vertices must be shared.
  const creaseCosine = Math.cos(Math.PI / 4);
  const positions = new Float32Array(index.count * 3);
  const normals = new Float32Array(index.count * 3);
  const indices = new Uint32Array(index.count);
  const groups = [];
  let count = 0;
  for (let vertex = 0; vertex < position.count; vertex++) {
    groups.length = 0;
    for (
      let corner = firstCorner[vertex];
      corner !== -1;
      corner = nextCorner[corner]
    ) {
      face.fromArray(faceNormals, corner - (corner % 3));
      let group = groups.find(
        ({ reference }) => reference.dot(face) >= creaseCosine,
      );
      if (!group) {
        group = { reference: face.clone(), sum: new Vector3(), index: count++ };
        groups.push(group);
      }
      group.sum.addScaledVector(face, angles[corner]);
      indices[corner] = group.index;
    }
    edge.fromBufferAttribute(position, vertex);
    for (const group of groups) {
      edge.toArray(positions, group.index * 3);
      group.sum.normalize().toArray(normals, group.index * 3);
    }
  }
  const surface = new BufferGeometry();
  surface.setIndex(new BufferAttribute(indices, 1));
  surface.setAttribute(
    "position",
    new BufferAttribute(positions.slice(0, count * 3), 3),
  );
  surface.setAttribute(
    "normal",
    new BufferAttribute(normals.slice(0, count * 3), 3),
  );
  return surface;
}
