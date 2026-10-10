import { z } from "zod";
const text = z.string().trim().max(6000);
const required = text.min(1, "This field is required.");
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.")
  .refine(
    (v) =>
      !Number.isNaN(Date.parse(v)) &&
      new Date(v).toISOString().slice(0, 10) === v,
    "Invalid date.",
  );
export const briefInputSchema = z.object({
  name: required.max(160),
  brand: required.max(160),
  product: required.max(300),
  idea: required,
  audience: required,
  objective: required,
  style: required,
  mood: required,
  platform: z.enum(["Instagram", "TikTok", "YouTube", "Website"]),
  aspectRatio: z.enum(["9:16", "16:9", "1:1"]),
  brandGuidelines: text,
  deliverables: z
    .array(
      z.enum(["Vertical video", "Product images", "Animation", "Explainer"]),
    )
    .min(1)
    .max(4),
  duration: z.string().max(100),
  budget: z.number().int().min(100).max(100000000),
  deadline: dateSchema,
  revisions: z.number().int().min(0).max(10),
  commercialUsage: required,
  referencePaths: z.array(z.string().max(500)).max(4),
});
export const briefOutputSchema = z.object({
  objective: required,
  audience: required,
  concept: required,
  visualDirection: required,
  specifications: required,
  brandConstraints: required,
  productionConsiderations: required,
  timeline: required,
  acceptanceCriteria: required,
  missingInformation: z.array(required).max(10),
  commercialConfirmations: z.array(required).max(10),
});
export const milestoneSchema = z.object({
  id: z.string().uuid(),
  name: required.max(160),
  description: text,
  deliverable: required,
  acceptanceCriteria: required,
  due: dateSchema,
  owner: z.enum(["Brand", "Creator"]),
  status: z.enum(["Not Started", "In Progress", "Needs Review", "Approved"]),
  dependency: text,
  notes: text,
});
export const passportSchema = z.object({
  tools: text,
  workflow: text,
  humanEdits: text,
  sources: text,
  music: text,
  fonts: text,
  stock: text,
  consent: text,
  brandPermissions: text,
  commercialUsage: text,
  evidence: text,
});
export const observationSchema = z.object({
  summary: required,
  observations: z
    .array(
      z.object({
        frame: z.number().int().min(1).max(4),
        category: z.enum([
          "Product",
          "Packaging",
          "Color",
          "Composition",
          "Logo",
          "Other",
        ]),
        observation: required,
        severity: z.enum(["Review", "Attention"]),
        suggestedAction: required,
      }),
    )
    .max(24),
  limitations: required,
});
export const licenseOutputSchema = z.object({
  summary: required,
  items: z
    .array(z.object({ field: required, concern: required, question: required }))
    .max(15),
  disclaimer: required,
});
export const matchOutputSchema = z.object({
  matches: z
    .array(
      z.object({
        creatorId: z.string(),
        reason: required,
        evidenceIds: z.array(z.string()),
        missingInformation: z.array(z.string()),
      }),
    )
    .max(8),
});
export const evaluationSchema = z.object({
  summary: required,
  criteria: z
    .array(
      z.object({
        criterion: z.enum([
          "Style",
          "Capability",
          "Deliverables",
          "Workflow",
          "Usage",
        ]),
        finding: required,
        evidenceIds: z.array(z.string()),
        status: z.enum(["Supported", "Needs review", "Not supplied"]),
      }),
    )
    .max(5),
  questions: z.array(required).max(8),
});
export const followUpSchema = z.object({ questions: z.array(required).max(8) });
export const proposedMilestonesSchema = z.object({
  warning: required,
  milestones: z
    .array(
      z.object({
        name: required,
        description: text,
        deliverable: required,
        acceptanceCriteria: required,
        due: dateSchema,
        owner: z.enum(["Brand", "Creator"]),
        dependency: text,
      }),
    )
    .min(3)
    .max(18),
});
export const campaignStateSchema = z.object({
  passport: passportSchema,
  passportReviewed: z.boolean(),
  acknowledged: z.array(z.string()).max(30),
  frames: z
    .array(
      z.object({
        id: z.string().uuid(),
        path: z.string().max(500),
        name: z.string().max(200),
        note: text,
        status: z.enum([
          "Pending",
          "Approved",
          "Needs revision",
          "Acknowledged",
        ]),
      }),
    )
    .max(4),
  referencePath: z.string().max(500),
  observations: observationSchema.nullable(),
  licenseReview: licenseOutputSchema.nullable(),
  evaluation: evaluationSchema.nullable(),
  checklist: z.object({
    received: z.boolean(),
    format: z.boolean(),
    consistency: z.boolean(),
    usage: z.boolean(),
    revisions: z.boolean(),
  }),
  deliveryNotes: text,
  acceptedAt: z.string().datetime().nullable(),
});
export const saveBriefSchema = z.object({
  id: z.string().uuid().optional(),
  input: briefInputSchema,
  output: briefOutputSchema.nullable(),
  creatorId: z.string().uuid().nullable(),
});
export const campaignPatchSchema = z.object({
  status: z.enum(["Draft", "In Review", "In Progress", "Completed"]).optional(),
  creatorId: z.string().uuid().nullable().optional(),
  state: campaignStateSchema.optional(),
  milestones: z.array(milestoneSchema).max(18).optional(),
  version: z.string().datetime(),
});
export type BriefInput = z.infer<typeof briefInputSchema>;
export type BriefOutput = z.infer<typeof briefOutputSchema>;
export type Passport = z.infer<typeof passportSchema>;
export type Milestone = z.infer<typeof milestoneSchema>;
export type CampaignState = z.infer<typeof campaignStateSchema>;
export type MatchOutput = z.infer<typeof matchOutputSchema>;
export type Creator = {
  id: string;
  slug: string;
  name: string;
  specialty: string;
  category: string;
  bio: string;
  location: string;
  styles: string[];
  industries: string[];
  tools: string[];
  deliverables: string[];
  price: number;
  experience: number;
  available: boolean;
  turnaround: number;
  art: number;
  portrait: number;
  passport: Passport;
  portfolio: {
    id: string;
    title: string;
    description: string;
    format: string;
    art: number;
  }[];
};
export type Brief = {
  id: string;
  owner_id: string;
  input: BriefInput;
  output: BriefOutput | null;
  created_at: string;
  updated_at: string;
};
export type Campaign = {
  id: string;
  owner_id: string;
  brief_id: string;
  creator_id: string | null;
  status: "Draft" | "In Review" | "In Progress" | "Completed";
  state: CampaignState;
  created_at: string;
  updated_at: string;
  brief: Brief;
  milestones: Milestone[];
};
export const passportLabels: Record<keyof Passport, string> = {
  tools: "Tools and model versions",
  workflow: "Workflow and prompt summary",
  humanEdits: "Human editing",
  sources: "Source assets",
  music: "Music and audio",
  fonts: "Fonts",
  stock: "Stock material",
  consent: "Likeness consent",
  brandPermissions: "Brand permissions",
  commercialUsage: "Commercial usage",
  evidence: "Supporting evidence",
};
export function emptyState(passport?: Passport): CampaignState {
  return {
    passport: passport || {
      tools: "",
      workflow: "",
      humanEdits: "",
      sources: "",
      music: "",
      fonts: "",
      stock: "",
      consent: "",
      brandPermissions: "",
      commercialUsage: "",
      evidence: "",
    },
    passportReviewed: false,
    acknowledged: [],
    frames: [],
    referencePath: "",
    observations: null,
    licenseReview: null,
    evaluation: null,
    checklist: {
      received: false,
      format: false,
      consistency: false,
      usage: false,
      revisions: false,
    },
    deliveryNotes: "",
    acceptedAt: null,
  };
}
export function exampleInput(): BriefInput {
  return {
    name: "Afterglow / Aurelle Skin",
    brand: "Aurelle Skin",
    product: "Premium facial serum",
    idea: "A 15-second cinematic reveal of an amber serum bottle on warm natural stone. Refined close-ups and soft afternoon light.",
    audience: "Skincare enthusiasts aged 25–40",
    objective: "Introduce the serum through an elegant daily ritual",
    style: "Cinematic, minimalist, warm, luxury",
    mood: "Refined and intimate",
    platform: "Instagram",
    aspectRatio: "9:16",
    brandGuidelines:
      "Preserve bottle shape, label wording and packaging color. Use warm light and natural textures.",
    deliverables: ["Vertical video", "Product images"],
    duration: "15 seconds",
    budget: 10000,
    deadline: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
    revisions: 2,
    commercialUsage:
      "Commercial advertising; geography, term, music and model usage conditions require confirmation.",
    referencePaths: [],
  };
}
