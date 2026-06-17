declare module "heic-convert" {
  type HeicConvertFormat = "JPEG" | "PNG";

  type HeicConvertOptions = {
    buffer: ArrayBuffer | Buffer | Uint8Array;
    format: HeicConvertFormat;
    quality?: number;
  };

  function convert(options: HeicConvertOptions): Promise<ArrayBuffer>;

  export default convert;
}
