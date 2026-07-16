import { CreativeAngleSpec, BattlecardItem, SocialTemplate } from "../types";

// Sample creative angles and competitor battlecards for the demo brand "Northwind".
// Competitors below (Rival CRM, BluePeak) are fictional placeholders.
export const creativeAngles: CreativeAngleSpec[] = [
  {
    id: "category_reframe",
    label: "Category Reframe",
    description: "Pivot the conversation from single-feature tools to complete workflow control.",
    emoji: "🔄",
  },
  {
    id: "local_market",
    label: "Audience Sharpness",
    description: "Speak with authority directly to the operations leads and team managers who feel the pain.",
    emoji: "🎯",
  },
  {
    id: "objection_crusher",
    label: "Objection Crusher",
    description: "Take apart the generic pitch and show why an integrated system actually closes the gap.",
    emoji: "🛡️",
  },
  {
    id: "storytelling",
    label: "Storytelling Mode",
    description: "A narrative tracking a team's move from spreadsheet chaos to a single command center.",
    emoji: "📖",
  },
  {
    id: "team_motivation",
    label: "Team Motivation",
    description: "Focus on visibility, transparent progress, and adoption to keep momentum high.",
    emoji: "⚡",
  },
];

export const battlecards: BattlecardItem[] = [
  {
    id: "ai_assistant",
    category: "lead_generation",
    objection: "Rival CRM has a 24/7 AI assistant that replies to inbound in 60 seconds.",
    counterWedge:
      "Fast replies are great, but if the rest of your workflow is disconnected, you are just booking meetings that go nowhere. Northwind centers on the whole record: intake, context, tasks, approvals, and reporting — so a fast first touch actually turns into finished work.",
    discoveryQuestions: [
      "After the assistant books the meeting, where do the notes, files, and next steps actually live?",
      "Do your people re-key the same information into two or three separate tools?",
    ],
    oneLiner: "Rival CRM books the meeting. Northwind helps your team finish everything after it.",
    metrics: [
      { label: "Cycle-time improvement", value: "+30%" },
      { label: "Admin time saved", value: "4.5 hrs/week" },
    ],
  },
  {
    id: "onboarding_speed",
    category: "onboarding",
    objection: "Rival CRM offers a done-for-you setup where they configure everything for you.",
    counterWedge:
      "Done-for-you sounds appealing, but waiting on a support queue to change a field or add a teammate is frustrating. Northwind offers same-day onboarding and direct controls — you own your templates, roles, and settings from minute one.",
    discoveryQuestions: [
      "If you need to change a field or add a role today, how long do you wait on support?",
      "Can a new teammate self-onboard from inside the app on day one?",
    ],
    oneLiner: "Their setup needs a support ticket; Northwind launches same-day with full control.",
    metrics: [
      { label: "Integration time", value: "< 2 hours" },
      { label: "Ramp-up window", value: "Under 1 day" },
    ],
  },
  {
    id: "reporting_depth",
    category: "report_claim",
    objection: "We already have pipeline cards in our current CRM to organize work.",
    counterWedge:
      "Standard CRMs treat records like flat contact cards. Northwind replaces the box with a full timeline — context, files, approvals, and status in one place, so a report is ready the moment you need it instead of after an hour of copy-paste.",
    discoveryQuestions: [
      "Does your current tool show context, files, and status on a single screen?",
      "How long does it take to pull a clean status report today?",
    ],
    oneLiner: "Older tools organize rows. Northwind operates as a true workspace for your team.",
    metrics: [
      { label: "Double-entry errors", value: "0" },
      { label: "Report prep time", value: "-70%" },
    ],
  },
  {
    id: "adoption",
    category: "performance_commissions",
    objection: "BluePeak is a well-known legacy tool our team already recognizes.",
    counterWedge:
      "Recognition is not adoption. Teams report sync issues and clunky mobile flows on legacy tools. Northwind wins adoption with a clean app, same-day launch, and reliable offline behavior — so the data actually gets entered.",
    discoveryQuestions: [
      "What is your real daily active usage on the current tool?",
      "How often does data get skipped because the flow is too slow in the field?",
    ],
    oneLiner: "BluePeak is a solid start — Northwind is where teams actually stick.",
    metrics: [
      { label: "Daily active usage", value: "+45%" },
      { label: "Avg. records per user", value: "+12%" },
    ],
  },
];

// High-fidelity fallback templates for each article and creative angle mapping.
export function getPrecompiledTemplates(articleId: string, angle: string): SocialTemplate[] {
  return [
    {
      platform: "linkedin",
      angle: "category_reframe" as any,
      title: "Category Reframe Post",
      content: `Let's stop talking about "speed-to-reply" as if it were the whole game.

A fast first touch is useful. But it is the doorway, not the room.

What happens after the meeting is booked?
- Are the notes sitting in someone's inbox?
- Are the next steps on a sticky note?
- Are the files in three different drives?

If your workflow is fragmented, fast replies just turn into dropped balls.

With Northwind, we replaced flat contact cards with a complete record — a single timeline holding context, files, tasks, approvals, and status.

Keep the whole workflow in one place. Real leverage starts after the first touch.

#Productivity #Operations #TeamWorkflow #Northwind`,
    },
    {
      platform: "instagram",
      angle: "category_reframe" as any,
      title: "Instagram Slide Series",
      content: "Clean brand carousel preview showing the unified workspace.",
      slides: [
        "Slide 1: Speed-to-reply is not the finish line. 🚪\n(Here is what actually gets work done...)",
        "Slide 2: Bots reply 24/7. But when the team picks it up on Monday:\n- Where is the context?\n- Where are the files?",
        "Slide 3: Without a single record, a booked meeting goes cold. You need structure, not just speed.",
        "Slide 4: Northwind pairs your pipeline with the full record. One place. Zero chaos.\n👉 Start a free trial at northwind.example.com",
      ],
    },
    {
      platform: "short_video",
      angle: "category_reframe" as any,
      title: "Shorts / Short-Video Teaser",
      content:
        "[Hook] Why most teams stay busy but still miss their targets.\n\n[Visual] Show scattered tabs, transition to one clean dashboard. Highlight the unified timeline.\n\n[Directive] Show bold, high-contrast text cards.",
      videoDirectives: "Fast pacing. Clean, modern look. Highlight the badge: 'Speed vs Structure'. Standard caption overlay.",
    },
  ];
}
