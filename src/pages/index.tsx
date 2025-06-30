import { useEffect, useRef } from "react";
import {
  Canvas,
  FabricObject,
  FabricImage,
  Circle,
  Rect,
  FabricText,
} from "fabric";
import { sampleSpec } from "@/gen/samples";
import type { SpecType } from "@/gen/schema";

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Fabric.js canvas
    const fabricCanvas = new Canvas(canvasRef.current, {
      width: sampleSpec.width,
      height: sampleSpec.height,
      backgroundColor: sampleSpec.background || "#ffffff",
    });

    fabricCanvasRef.current = fabricCanvas;

    // Render objects from the spec
    renderSpec(fabricCanvas, sampleSpec);

    // Cleanup function
    return () => {
      fabricCanvas.dispose();
    };
  }, []);

  const renderSpec = async (canvas: Canvas, spec: SpecType) => {
    for (const obj of spec.objects) {
      let fabricObject: FabricObject | null = null;

      switch (obj.type) {
        case "text":
          fabricObject = new FabricText(obj.text, {
            left: obj.left,
            top: obj.top,
            fontSize: obj.fontSize || 16,
            fontFamily: obj.fontFamily || "Arial",
            fontWeight: obj.fontWeight || "normal",
            fill: obj.fill || "#000000",
            textAlign: obj.textAlign || "left",
            originX: obj.originX || "left",
            originY:
              (obj.originY === "baseline" ? "top" : obj.originY) || "top",
            opacity: obj.opacity || 1,
          });
          break;

        case "rect":
          fabricObject = new Rect({
            left: obj.left,
            top: obj.top,
            width: obj.width,
            height: obj.height,
            fill: obj.fill || "transparent",
            stroke: obj.stroke,
            rx: obj.rx || 0,
            ry: obj.ry || 0,
            opacity: obj.opacity || 1,
          });
          break;

        case "circle":
          fabricObject = new Circle({
            left: obj.left,
            top: obj.top,
            radius: obj.radius,
            fill: obj.fill || "transparent",
            stroke: obj.stroke,
            opacity: obj.opacity || 1,
            originX: "center",
            originY: "center",
          });
          break;

        case "image":
          try {
            const imgElement = await loadImage(obj.src);
            fabricObject = new FabricImage(imgElement, {
              left: obj.left,
              top: obj.top,
              scaleX: obj.width / imgElement.width,
              scaleY: obj.height / imgElement.height,
              opacity: obj.opacity || 1,
            });
          } catch (error) {
            console.error(`Failed to load image: ${obj.src}`, error);
            // Create a placeholder rectangle for failed images
            fabricObject = new Rect({
              left: obj.left,
              top: obj.top,
              width: obj.width,
              height: obj.height,
              fill: "#cccccc",
              stroke: "#999999",
              strokeWidth: 2,
              opacity: obj.opacity || 1,
            });
          }
          break;

        default:
          console.warn(`Unknown object type: ${(obj as any).type}`);
          continue;
      }

      if (fabricObject) {
        canvas.add(fabricObject);
      }
    }

    canvas.renderAll();
  };

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  const saveAsPNG = () => {
    if (!fabricCanvasRef.current) return;

    // Get the canvas as a data URL at 3x resolution for sharp text
    const dataURL = fabricCanvasRef.current.toDataURL({
      format: "png",
      quality: 1.0,
      multiplier: 3, // 3x resolution for crisp text and graphics
    });

    // Create a download link
    const link = document.createElement("a");
    link.download = "ad-canvas.png";
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <h1 className="mb-4 text-2xl font-bold">Ad Prompter Canvas</h1>
        <div className="mb-4">
          <button
            onClick={saveAsPNG}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
          >
            Save as PNG
          </button>
        </div>
        <div className="border border-gray-300 shadow-lg">
          <canvas ref={canvasRef} />
        </div>
      </main>
    </>
  );
}
