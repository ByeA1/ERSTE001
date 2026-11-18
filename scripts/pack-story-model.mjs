import { MeshoptEncoder } from 'meshoptimizer/encoder';

/** Lossless buffer compression only: no quantization, welding or triangle reorder.
 * Keep the NX export as the source of truth, including its welded section mesh. */
export async function packStoryModel(source) {
  await MeshoptEncoder.ready;
  if (source.readUInt32LE(0) !== 0x46546c67 || source.readUInt32LE(4) !== 2)
    throw Error('Expected a GLB 2.0 source');
  const jsonLength = source.readUInt32LE(12);
  const json = JSON.parse(source.subarray(20, 20 + jsonLength));
  const bin = source.subarray(28 + jsonLength);
  if (json.buffers.length !== 1 || json.buffers[0].uri || json.extensionsRequired?.length)
    throw Error('Unexpected story GLB buffers/extensions; review before compressing');
  const indices = new Set(json.meshes.flatMap(m => m.primitives.map(p => p.indices)));
  const chunks = [];
  let offset = 0, fallbackOffset = 0;
  for (const [i, view] of json.bufferViews.entries()) {
    const accessors = json.accessors.map((a, index) => ({ ...a, index })).filter(a => a.bufferView === i);
    if (accessors.length !== 1 || accessors[0].sparse || accessors[0].byteOffset)
      throw Error(`Unexpected interleaved/sparse story buffer ${i}`);
    const accessor = accessors[0];
    const stride = view.byteStride ?? view.byteLength / accessor.count;
    const mode = indices.has(accessor.index) ? 'INDICES' : 'ATTRIBUTES';
    const data = bin.subarray(view.byteOffset ?? 0, (view.byteOffset ?? 0) + view.byteLength);
    const packed = Buffer.from(MeshoptEncoder.encodeGltfBuffer(data, accessor.count, stride, mode, 0));
    const padding = (4 - packed.length % 4) % 4;
    chunks.push(packed, Buffer.alloc(padding));
    view.buffer = 1;
    view.byteOffset = fallbackOffset;
    view.extensions = { EXT_meshopt_compression: {
      buffer: 0, byteOffset: offset, byteLength: packed.length,
      byteStride: stride, count: accessor.count, mode, filter: 'NONE',
    } };
    fallbackOffset += view.byteLength;
    offset += packed.length + padding;
  }
  json.buffers = [
    { byteLength: offset },
    { byteLength: fallbackOffset, extensions: { EXT_meshopt_compression: { fallback: true } } },
  ];
  json.extensionsUsed = [...(json.extensionsUsed ?? []), 'EXT_meshopt_compression'];
  json.extensionsRequired = ['EXT_meshopt_compression'];
  const text = Buffer.from(JSON.stringify(json));
  const jsonChunk = Buffer.concat([text, Buffer.alloc((4 - text.length % 4) % 4, 0x20)]);
  const binaryChunk = Buffer.concat(chunks);
  const header = Buffer.alloc(20), binaryHeader = Buffer.alloc(8);
  header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4);
  header.writeUInt32LE(28 + jsonChunk.length + binaryChunk.length, 8);
  header.writeUInt32LE(jsonChunk.length, 12); header.writeUInt32LE(0x4e4f534a, 16);
  binaryHeader.writeUInt32LE(binaryChunk.length); binaryHeader.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, jsonChunk, binaryHeader, binaryChunk]);
}
