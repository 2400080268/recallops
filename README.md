# RecallOps

An AI incident-response agent that uses Hindsight organizational memory to learn from past production incidents.

## What Is RecallOps?

RecallOps helps engineering teams investigate production incidents using both LLM reasoning and the team's retained incident experience. Instead of approaching every failure from scratch, the agent can recall relevant ShopEase incidents, their successful resolutions, failed approaches, and lessons learned.

Repeated failures are costly when their fixes are buried in old incident records and postmortems. A language model can reason about current signals, but reasoning alone does not preserve an organization's knowledge between investigations. RecallOps combines an incident-response workflow with Groq-powered analysis and Hindsight's persistent memory so prior operational experience can inform future recommendations.

## The Problem

Production incidents often repeat, while the knowledge needed to resolve them is scattered across historical tickets and postmortems. RecallOps connects current incident signals to that prior experience: LLM reasoning + Hindsight memory + an incident-response workflow.

## The Solution

```text
Incident
	-> Agent investigation
	-> Hindsight recall
	-> Historical evidence
	-> Recommended remediation
	-> Engineer resolution
	-> Hindsight retention
	-> Future incident
	-> Recently learned experience
```

A resolved incident can become reusable organizational knowledge for later investigations.

## How It Works

```text
User / Incident Simulator
				-> RecallOps Next.js app and API routes
				-> Investigation agent
				-> Groq reasoning and incident synthesis
				-> Hindsight memory recall
				-> Evidence and recommendations in the app
				-> Resolution and postmortem retention in Hindsight
				-> Future investigation and recall
```

The app coordinates investigation, memory search, evidence presentation, and resolution. Groq analyzes the incident and synthesizes findings; the Hindsight client recalls and retains incident knowledge.

## Groq + Hindsight Roles

- **Groq** provides LLM reasoning and synthesis: it interprets incident signals and produces an investigation and remediation recommendations.
- **Hindsight** provides persistent organizational memory: it recalls historical incidents and retains resolved postmortems for future investigations.

In short: the LLM reasons; Hindsight supplies and preserves memory.

## Key Features

- Incident simulator and incident directory
- AI-assisted incident investigation
- Hindsight organizational memory and historical recall
- Evidence Chain explaining why a recommendation is supported
- Learning Timeline showing investigation through future reuse
- Visibility into what worked and what failed
- First-principles handling when no close historical match is found
- Resolution, postmortem retention, and recently learned experience

## The Learning Loop

1. An incident occurs and the agent investigates its signals.
2. Hindsight recalls relevant historical incidents and lessons.
3. The engineer reviews the evidence and resolves the incident.
4. RecallOps retains the resolution and postmortem in Hindsight.
5. When a similar incident occurs, the agent can recall that newly retained experience and use it in its investigation.

As organizational incident memory grows, future investigations can draw on more of the team's accumulated experience.

## Evidence Chain

The Evidence Chain answers “Why this recommendation?” by presenting the historical incidents and resolution details supporting an investigation. When no close historical match is available, RecallOps identifies the incident as novel and uses first-principles reasoning instead of inventing historical evidence.

## Learning Timeline

The timeline makes the learning cycle visible: incident, investigation, memory recall, resolution, retention, and potential future reuse. Its milestones reflect the incident and memory state available to the application.

## Tech Stack

- Next.js, React, and TypeScript
- Tailwind CSS
- Groq, through `groq-sdk`
- Hindsight, through `@vectorize-io/hindsight-client`
- Lucide React icons

## Run Locally

Requirements: Node.js and npm, plus Groq and Hindsight API credentials.

```bash
git clone https://github.com/2400080268/recallops.git
cd recallops
npm install
```

Create `.env.local` in the project root with your own credentials:

```dotenv
GROQ_API_KEY=your_groq_key
HINDSIGHT_API_KEY=your_hindsight_key
HINDSIGHT_BASE_URL=https://api.hindsight.vectorize.io
HINDSIGHT_BANK_ID=shopease-incidents
```

Then start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Never commit real credentials.

## Demo Flow

Open the Dashboard, create a Checkout API 503 / Redis contention incident in the Simulator, and investigate it with RecallOps. Review Hindsight recall and the Evidence Chain, resolve and retain the incident, then investigate a similar incident to see whether the newly retained experience is recalled.

## How RecallOps Uses Hindsight

RecallOps uses the Hindsight client to search organizational memory during investigations and retain resolved incident postmortems. Historical incident records provide context for recommendations; retained resolutions and lessons can be recalled in future investigations. This creates a persistent, closed-loop learning workflow without relying on the LLM alone to remember past sessions.

## Project Status

RecallOps has been verified across its AI investigation, memory recall, retention, and closed-loop learning flows. Automated intelligence and product-hardening suites are included in the repository.
