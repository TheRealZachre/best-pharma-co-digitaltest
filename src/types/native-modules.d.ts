declare module "ffmpeg-static" {
  const path: string | null;
  export default path;
}

declare module "@xenova/transformers" {
  export function pipeline(
    task: string,
    model?: string,
    options?: Record<string, unknown>
  ): Promise<unknown>;
}

declare module "onnxruntime-node" {
  const runtime: unknown;
  export default runtime;
}
