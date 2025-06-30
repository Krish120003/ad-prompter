import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { env } from "@/env";
import { Spec } from "@/gen/schema";

const google = createGoogleGenerativeAI({
  apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY,
});

const requestSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt } = requestSchema.parse(req.body);

    const result = await generateObject({
      model: google("gemini-2.5-flash-preview-04-17"),
      schema: Spec,
      prompt: `You are an expert ad creative designer. Generate an ad creative specification based on the user's prompt.

Guidelines:
- Create visually appealing layouts with proper spacing
- Use appropriate colors that work well together
- Position elements logically (headlines at top, call-to-action at bottom, etc.)
- For images, use descriptive paths
- Make text readable with good contrast
- Consider typical ad dimensions (Instagram post format)

Available images:



https://i.imgur.com/wmwP9Fu.jpeg — "Overhead, moody food-photography shot of dal makhani in a speckled ceramic bowl on a beige plate, garnished with cilantro, red-onion petals and a green chili; two charred naan on the side, wooden spoon in the bowl, mustard linen napkin and pink flowers left, antique cutlery right, dark tabletop backdrop."

https://i.imgur.com/0aZixlx.png — "Transparent-background cut-out of a round plate holding dal makhani (creamy lentils) in a rustic bowl, paired with naan, sliced red onions and a green chili—perfect for compositing."

https://i.imgur.com/bTAKsJt.png — "MV’Z Kitchen logo: bold circular emblem with black backdrop, stylised orange steaming bowl and green leaves, ornate swirls, large white gothic text 'MV’Z KITCHEN' and lime-green tagline 'Food with Flavour'."

https://i.imgur.com/X1DbV06.png — "Isolated product shot of a stainless-steel Indian tiffin (three-tier cylindrical lunchbox) with latch locks and a fold-down carry handle, subtle metallic reflections, transparent background."

User prompt: ${prompt}`,
    });

    return res.status(200).json({ spec: result.object });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid request body",
        details: error.errors,
      });
    }
    console.error("AI generation error:", error);
    return res.status(500).json({ error: "Failed to generate response" });
  }
}
