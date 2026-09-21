# ML Monday: Autonomous Job Search Agent

Welcome to the AI Society Innovation Lab's ML Monday workshop! This repository contains a Hybrid Autonomous Career Evaluator built with Stagehand and the Gemini API. The agent autonomously navigates GitHub job boards, parses application requirements, and scores internship listings against your personal resume and career preferences.

## Prerequisites

* **Node.js v22.18.0 or higher:** This is a strict requirement. The Stagehand library relies on native WebSockets to communicate with the browser, which will crash on older Node versions.
* **Git**
* **Gemini API Key:** You can generate a free key from Google AI Studio.

## 

## Local Setup Guide
**0. Install Node.js v22 (via NVM)**
You must be running Node.js version 22 or higher. The easiest way to switch versions is using Node Version Manager (NVM). In your terminal, run:
```bash
nvm install 22
nvm use 22
```

_(If the nvm command is not recognized, download the Node 22 installer directly from [the official Node.js website](https://nodejs.org/en/download))._

**1. Clone the repository**

```bash
git clone <your-repo-url>
cd ML-Monday-Job-Searcher
```

**2. Install Node dependencies**
Ensure you are in the project root, then install the required packages:

```bash
npm install
```

**3. Install Chromium**
The agent requires a local Playwright Chromium instance to execute browser actions:

```bash
npx playwright install chromium
```

**4. Configure Environment Variables**
Create a new file named exactly `.env` in the root directory of the project. Add your Gemini API key without any spaces around the equals sign:

```env
GOOGLE_GENERATIVE_AI_API_KEY="AIzaSyYourActualKeyHere..."
```

## Customizing Your Agent

Before running the evaluation, open `index.ts` in your editor. Locate the two configuration variables at the top of the file:

* `MY_PROFILE`: Update this with your major, graduation year, past experiences, and technical stack.


* `MY_PREFERENCES`: Define your target locations, acceptable salary ranges, and hard dealbreakers (e.g., unpaid roles, specific legacy languages).



The Gemini reasoning layer will use this exact context to calculate a 0-100 fit score for every job it scrapes.

## Running the Pipeline

Once your profile is set, run the start script:

```bash
npm start
```

A Chromium window will automatically open so you can watch the agent navigate the SimplifyJobs repository, extract roles, and process the evaluations in real-time. All roles that successfully pass your dealbreaker checks will be exported automatically to a new `matched_jobs.json` file.

## Troubleshooting

* **`ReferenceError: WebSocket is not defined`**: You are running an unsupported, older version of Node.js. Upgrade your environment to Node v22+ and verify the update by running `node -v`.
* **Playwright download hangs**: Windows Defender or strict campus network policies can sometimes block the background Chromium download. Try running your terminal as an Administrator.
* **Module not found errors**: Ensure you ran `npm install` before trying to start the script.
* **Need hands-on help?**: Flag down any of the AIS officers during the workshop!