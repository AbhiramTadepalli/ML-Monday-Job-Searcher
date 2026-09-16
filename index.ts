import { localBrowser, Stagehand } from "@browserbasehq/stagehand";
import { z } from "zod";
import fs from "fs/promises"; // <-- NEW: Import the file system module
import "dotenv/config";

/** TODO: Fill in your information */
const MY_PROFILE = `
Candidate Name: John Doe
Education: UT Dallas, Bachelor's in Computer Science (Graduating May 2029)
Experience: 
- AI Mentee at the AI Society, built a LSTM model that could track airport traffic
- Engineer at Nebula Labs, helped develop a full-stack web application used by 20k+ students
- Undergraduate Researcher (Syssec Lab, security provenance analysis)
Technical Skills: 
- Frontend/Fullstack: React, Next.js, TypeScript, Tailwind CSS
- Cloud/Backend: Google Cloud Platform (GCP), AWS, Node.js, MongoDB, PostgreSQL, Docker
- AI/Data Pipeline: Python, PyTorch, PySpark, scikit-learn
`;

/** TODO: Fill in your preferences */
const MY_PREFERENCES = `
Target Locations: Dallas, TX; Austin, TX; or Fully Remote.
Preferred Tech Stack: React, Next.js, Python, AWS, or PySpark.
Dealbreakers: 
- Roles requiring an active DoD security clearance.
- Unpaid positions.
- Strictly .NET/C# legacy environments.
- Does not accept Spring 2028 grads
Minimum Salary Expectation: $85,000+ (if explicitly listed).
`;

async function main() {
  console.log("🤖 Booting Hybrid Autonomous Career Evaluator...");
  const browser = await localBrowser.launch({ headless: true }); // change to headless: false if you're running it locally and want to see the browser

  try {
    // sets up stagehand with a model and API key for reasoning
    const stagehand = await Stagehand.create({
      browser,
      model: {
        modelName: "google/gemini-3.1-flash-lite-preview",
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY 
      },
      logging: { level: "info" } 
    });


    console.log("🌐 Navigating to SimplifyJobs New Grad Board...");
    const [page] = await browser.context.pages();
    await page.goto("https://github.com/vanshb03/Summer2027-Internships?tab=readme-ov-file", { waitUntil: "domcontentloaded" }); // <-- this is the starting job board the browser navigates to

    // page-specific selectors help your pipeline find the exact data you want to act on
    console.log("⏳ Waiting for README table to render...");
    await page.waitForSelector(".markdown-body table", { timeout: 15000 }); // sometimes pages need time to render

    console.log("⚡ Finding the Job Roles table...");
    const jobs = await page.evaluate(() => {
      const tables = Array.from(document.querySelectorAll(".markdown-body table, article table"));
      
      // filter specifically for the job list table by checking its column headers
      const jobTable = tables.find(t => {
        const headers = Array.from(t.querySelectorAll("th")).map(th => th.textContent?.trim().toLowerCase() || "");
        return headers.some(h => h.includes("application"));
      });

      if (!jobTable) return [];

      // iterate through the rows of the table
      const rows = Array.from(jobTable.querySelectorAll("tbody tr"));
      const extracted = [];
      let currentCompany = "Unknown Company";

      for (const row of rows) {
        if (extracted.length >= 20) break; // limit to 20 jobs listings. TODO: feel free to change this on your own time

        const cells = Array.from(row.querySelectorAll("td"));
        if (cells.length < 4) continue;

        // Column 0: Company
        const rawCompany = cells[0]?.textContent?.trim() || "";
        if (rawCompany && !rawCompany.includes("↳")) {
          currentCompany = rawCompany;
        }

        // Column 1: Role
        const role = cells[1]?.textContent?.trim() || "Software Engineer";

        // Column 3: Application (Dark gray 'Apply' button)
        const appCell = cells[3];
        const anchors = Array.from(appCell.querySelectorAll("a[href]")) as HTMLAnchorElement[];
        if (anchors.length === 0) continue;

        const applyUrl = anchors[0].href;

        extracted.push({
          company: currentCompany,
          role,
          applyUrl
        });
      }

      // shuffle the extracted jobs to get a random sample of 3 -- otherwise some websites might rate limit our IP.
      for (let i = extracted.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [extracted[i], extracted[j]] = [extracted[j], extracted[i]];
      }
      return extracted.slice(0, 3); // return only 3 random jobs for evaluation, saves on tokens and rate limits for workshop purposes
    });

    console.log(`📌 Extracted ${jobs.length} jobs directly from the Application column:`);
    console.log(JSON.stringify(jobs, null, 2));

    if (jobs.length === 0) {
      console.warn("⚠️ Could not locate the job table or application links. Check GitHub layout.");
      return;
    }

    const matchedJobs = [];

    // ***** AI REASONING LAYER ******
    for (let i = 0; i < jobs.length; i++) {
        const job = jobs[i];
        console.log(`\n🕵️‍♂️ [${i + 1}/${jobs.length}] Evaluating ${job.company} — ${job.role}`);
        console.log(`🔗 Navigating to: ${job.applyUrl}`);
        
        try {
          await page.goto(job.applyUrl, { waitUntil: "networkidle", timeout: 30000 });
          console.log("⏳ Waiting for JavaScript to render the job description...");
          await page.waitForTimeout(3000); 

          /** TODO: Define the schema for job analysis */
          const JobAnalysisSchema = z.object({
              roleTitle: z.string().default(job.role),
              company: z.string().default(job.company),
              preferenceAlignment: z.string().describe("Evaluate the role against the candidate's preferences (Location, Dealbreakers, Tech Stack). Note any red flags or perfect matches."),
              dealbreakerHit: z.boolean().describe("True if the job hits ANY of the candidate's listed dealbreakers."),
              matchScore: z.number().min(0).max(100).describe("You are a recruiter on a time crunch. Evaluate the candidate's fit for this role on a scale of 0-100, where 100 is a perfect match. Consider hard requirements, skill match, subject-matter experience (or lack therof), and nice to haves. Be honest."),
              matchAnalysis: z.string().describe("You are a recruiter for this company. Provide a two-sentence breakdown comparing the candidate's skills against the job post. Be Honest."),
              missingSkills: z.array(z.string()).describe("Key requirements listed on the page that are missing from candidate profile.")
          }); 

          console.log("🧠 Stagehand + Gemini evaluating page contents...");
          /** TODO: Build prompt for job analysis */
          const analysis = await stagehand.extract(
              `Analyze this job posting against the candidate profile below:
              CANDIDATE PROFILE:
              ${MY_PROFILE}
              
              CANDIDATE PREFERENCES:
              ${MY_PREFERENCES}`,
              JobAnalysisSchema
          );

          console.log(`📊 Fit Score: ${analysis.data.matchScore}/100 | Relevant: ${analysis.data.preferenceAlignment}`);
          console.log(`💡 ${analysis.data.matchAnalysis}`);

          if (!analysis.data.dealbreakerHit) {
              matchedJobs.push({
                ...analysis.data,
                applyUrl: job.applyUrl
              });
          }
        } catch (err) {
          console.error(`❌ Could not evaluate ${job.applyUrl}:`, (err as Error).message);
        }
    }

    // export to json file
    if (matchedJobs.length > 0) {
      console.log("\n🎯 Final Matching Roles & Candidate Analysis:");
      await fs.writeFile("matched_jobs.json", JSON.stringify(matchedJobs, null, 2));
      console.log(JSON.stringify(matchedJobs, null, 2));
    }

  } finally {
    await browser.close();
  }
}

main();