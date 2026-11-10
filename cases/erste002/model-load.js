const raw = "./assets/shell-full.glb";

export async function loadStoryModel(loader, signal) {
  const preload = document.querySelector("[data-story-model]");
  let bytes;
  if (typeof DecompressionStream === "function" && preload?.href.endsWith(".glb.bin")) {
    try {
      const response = await fetch(preload.href, { signal });
      if (!response.ok) throw new Error(`Packed GLB download failed: ${response.status}`);
      const stream = response.body.pipeThrough(new DecompressionStream("gzip"));
      bytes = await new Response(stream).arrayBuffer();
    } catch (error) {
      if (signal?.aborted) throw error;
    }
  }
  if (!bytes) {
    const response = await fetch(raw, { signal });
    if (!response.ok) throw new Error(`GLB download failed: ${response.status}`);
    bytes = await response.arrayBuffer();
  }
  if (signal?.aborted) throw new DOMException("Model download cancelled", "AbortError");
  return loader.parseAsync(bytes, new URL("./assets/", location.href).href);
}
