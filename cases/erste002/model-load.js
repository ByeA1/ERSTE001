import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";

const raw = "./assets/shell-full.glb";

async function download(url, signal, progress) {
  const request = new AbortController();
  const cancel = () => request.abort(signal?.reason);
  signal?.addEventListener('abort', cancel, { once: true });
  if (signal?.aborted) cancel();
  let timer;
  const heartbeat = () => {
    clearTimeout(timer);
    timer = setTimeout(() => request.abort(new Error('Model download stalled')), 25000);
  };
  try {
    heartbeat();
    const response = await fetch(url, { signal: request.signal });
    if (!response.ok) throw Error(`Model download failed: ${response.status}`);
    const total = Number(response.headers.get('content-length')) || 0;
    if (!response.body) return response.arrayBuffer();
    const reader = response.body.getReader(), chunks = [];
    let received = 0;
    progress('download', received, total);
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      chunks.push(value); received += value.byteLength;
      heartbeat(); progress('download', received, total);
    }
    const bytes = new Uint8Array(received);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return bytes.buffer;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', cancel);
  }
}

export async function loadStoryModel(loader, signal) {
  loader.setMeshoptDecoder(MeshoptDecoder);
  const preload = document.querySelector("[data-story-model]");
  let lastProgress = 0;
  const progress = (phase, received = 0, total = 0) => {
    if (phase === 'download' && received !== total && performance.now() - lastProgress < 250) return;
    lastProgress = performance.now();
    document.body.dataset.projectLoadProgress = `${phase}:${received}:${total}`;
  };
  const parse = async bytes => {
    if (signal?.aborted) throw new DOMException('Model download cancelled', 'AbortError');
    if (new DataView(bytes).getUint32(0, true) !== 0x46546c67) throw Error('Invalid GLB response');
    progress('parse');
    const result = await loader.parseAsync(bytes, new URL('./assets/', location.href).href);
    if (signal?.aborted) throw new DOMException('Model download cancelled', 'AbortError');
    progress('initialize');
    return result;
  };
  if (typeof DecompressionStream === "function" && preload?.href.endsWith(".glb.bin")) {
    try {
      const packed = await download(preload.href, signal, progress);
      progress('decompress');
      // Some hosts apply Content-Encoding themselves; fetch has already decoded it.
      const bytes = new DataView(packed).getUint32(0, true) === 0x46546c67 ? packed
        : await new Response(new Blob([packed]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
      return await parse(bytes);
    } catch (error) {
      if (signal?.aborted) throw error;
    }
  }
  return parse(await download(raw, signal, progress));
}
