import { Article } from "../types";

// Demo seed content for the fictional brand "Northwind" — a team-productivity
// SaaS used to exercise the content pipeline end to end. Everything below is
// sample data; swap it for your own brand's library once the app is wired up.
export const articles: Article[] = [
  {
    id: "why-a-single-source-of-truth-beats-scattered-docs-2026",
    title: "Why a Single Source of Truth Beats Scattered Docs in 2026",
    slug: "/blog/why-a-single-source-of-truth-beats-scattered-docs-2026",
    category: "Guides",
    badge: "Article",
    readTime: "8 min read",
    seoTitle: "Why a Single Source of Truth Beats Scattered Docs in 2026 | Northwind",
    description:
      "Teams still keep knowledge in five places at once — chat, spreadsheets, sticky notes, someone's inbox. By the end of the week half of it is stale. Here is why a unified workspace changes the math.",
    heroAngle: "The Silent Productivity Tax Hiding in Your Team's Tools",
    highlights: [
      "Fragmented tooling quietly erodes accuracy and accountability.",
      "A unified workspace measurably improves ROI, speed, and consistency.",
      "Small teams benefit fastest because efficiency gains compound quickly.",
      "The right system fits how people already work instead of fighting it.",
      "When data replaces chaos, daily activity turns into clear, actionable insight.",
    ],
    content: `Scattered documentation persists because it feels simple. No setup, no migration, no learning curve. But what it really does is quietly tax every decision you make. In 2026 that gap is no longer affordable.

A unified workspace like Northwind brings tasks, project tracking, and team messaging into one screen, so people know exactly what to do next and managers can make informed calls from real data instead of guesswork.`,
  },
  {
    id: "five-habits-of-high-output-teams",
    title: "Five Habits of High-Output Teams",
    slug: "/blog/five-habits-of-high-output-teams",
    category: "Guides",
    badge: "Article",
    readTime: "6 min read",
    seoTitle: "Five Habits of High-Output Teams | Northwind",
    description:
      "The difference between a team that ships and one that stalls is rarely talent. It is a handful of repeatable habits. Here are five that consistently separate the top performers.",
    heroAngle: "What Nobody Tells You About Consistent Output",
    highlights: [
      "Communication: making the first message land instead of triggering a meeting.",
      "Active listening: reading context instead of reacting to the loudest signal.",
      "Ownership: framing work as a problem to solve, not a ticket to close.",
      "Feedback loops: short, structured reviews that create real momentum.",
      "Follow-through: the 20% of tasks where most value quietly leaks out.",
    ],
    content: `Output is not about working more hours. It is about removing friction from the handoffs between people. The best teams treat their process like a product — measuring where work slows down and steadily engineering the drag out of it.`,
  },
  {
    id: "the-complete-guide-to-workflow-automation-2026",
    title: "The Complete Guide to Workflow Automation (2026)",
    slug: "/blog/the-complete-guide-to-workflow-automation-2026",
    category: "Guides",
    badge: "Guide",
    readTime: "7 min read",
    seoTitle: "The Complete Guide to Workflow Automation | Northwind",
    description:
      "The practical playbook for automating repetitive work. How modern teams combine templates, triggers, and analytics without turning their stack into a black box.",
    heroAngle: "The Complete Playbook for Doing Less Busywork",
    highlights: [
      "Work has shifted from raw effort to structured, measurable operations.",
      "Template-based flows have replaced one-off manual steps to boost throughput.",
      "Teams scale by specializing repeatable pipelines instead of reinventing them.",
      "Automation removes dead time so people spend hours on judgment, not typing.",
      "Northwind unifies tasks, approvals, and analytics in a single workspace.",
    ],
    content: `Effective automation is about predictable precision. The best teams treat each recurring process like a small campaign — analyzing where handoffs stall and timing interventions to capture the most leverage per hour spent.`,
  },
  {
    id: "northwind-review-more-than-a-task-tracker",
    title: "Northwind Review: More Than a Task Tracker",
    slug: "/blog/northwind-review-more-than-a-task-tracker",
    category: "Reviews",
    badge: "Review",
    readTime: "5 min read",
    seoTitle: "Northwind Review: More Than a Task Tracker | Northwind",
    description:
      "An in-depth look at Northwind's operations: shared workspaces, live dashboards, transparent reporting, and a clean mobile experience.",
    heroAngle: "More Than an App — An Operating System for Teams",
    highlights: [
      "Replace scattered spreadsheets with one collaborative team workspace.",
      "Drive retention with transparent, visible progress and clear ownership.",
      "Get precise operational visibility into throughput and cycle time.",
      "Attach forms, files, and context inside a single record.",
    ],
    content: `Many tools track tasks, but Northwind operates as a true team OS. It gives teams the ability to run intake, review, approval, and reporting from one place — without stitching five subscriptions together.`,
  },
];
