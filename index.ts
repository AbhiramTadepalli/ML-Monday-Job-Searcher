import { localBrowser, Stagehand } from "@browserbasehq/stagehand";
import { z } from "zod";
import "dotenv/config";

async function main() {
  console.log("🤖 Booting Gemini-powered Autonomous Agent (Stagehand v4)...");

  const browser = await localBrowser.launch({ headless: false });

  try {
    const stagehand = await Stagehand.create({
      browser,
      model: {
        modelName: "google/gemini-3.1-flash-lite-preview",
        // 👇 THIS IS THE REQUIRED V4 FIX 👇
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY 
      },
      logging: { level: "info" }
    });

    console.log("🌐 Navigating to target...");
    
    try {
      const [page] = await browser.context.pages();
      await page.goto("https://news.ycombinator.com/jobs");

      const JobSchema = z.object({
        title: z.string().describe("The title of the job position"),
        company: z.string().describe("The name of the company hiring"),
      }); 

      console.log("👀 Analyzing page structure via AI...");

      const result = await stagehand.extract(
        "Extract all the job postings listed on this page.",
        z.array(JobSchema)
      );
      
      console.log("✅ Extraction Complete:");
      console.log(JSON.stringify(result.data, null, 2));

    } finally {
      await stagehand.close();
    }
  } finally {
    await browser.close();
  }
}

main();