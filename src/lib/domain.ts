import type { BriefInput, CampaignState, Creator, Passport } from "./schemas";
export const MATCH_WEIGHTS = {
  style: 0.35,
  capability: 0.25,
  deliverables: 0.2,
  workflow: 0.1,
  evidence: 0.1,
};
export function rankCreators(creators: Creator[], brief: BriefInput) {
  const words = (
    brief.style +
    " " +
    brief.mood +
    " " +
    brief.idea
  ).toLowerCase();
  return creators
    .map((c) => {
      const tags = c.styles.filter((x) => words.includes(x.toLowerCase()));
      const fit = brief.deliverables.filter((d) => c.deliverables.includes(d));
      const style = tags.length / c.styles.length;
      const capability = brief.deliverables.some((d) =>
        c.deliverables.includes(d),
      )
        ? 1
        : 0;
      const evidence = c.passport.evidence === "Not supplied" ? 0 : 1;
      const score = Math.round(
        100 *
          (style * MATCH_WEIGHTS.style +
            capability * MATCH_WEIGHTS.capability +
            (fit.length / brief.deliverables.length) * MATCH_WEIGHTS.deliverables +
            MATCH_WEIGHTS.workflow +
            evidence * MATCH_WEIGHTS.evidence),
      );
      const constraints = [
        ...(c.price > brief.budget ? ["Above stated budget"] : []),
        ...(!c.available ? ["Availability requires confirmation"] : []),
        ...(fit.length < brief.deliverables.length
          ? ["Some deliverables not listed"]
          : []),
      ];
      return {
        creator: c,
        score,
        tags,
        constraints,
        eligible: constraints.length === 0,
        explanation: `${tags.length ? tags.join(", ") + " style tags overlap." : "No exact style-tag overlap."} ${fit.join(", ") || "No requested deliverables"} listed. Workflow is creator-declared.`,
      };
    })
    .sort(
      (a, b) => Number(b.eligible) - Number(a.eligible) || b.score - a.score,
    );
}
export function passportFindings(p: Passport) {
  return Object.entries(p)
    .filter(
      ([, v]) =>
        !v.trim() ||
        /not supplied|unknown|requires confirmation|to be confirmed|to be agreed|requested|not attached/i.test(
          v,
        ),
    )
    .map(([key, value]) => ({
      key,
      reason:
        !value.trim() || /^(not supplied|unknown)$/i.test(value)
          ? "Information missing"
          : "Confirmation or evidence needed",
    }));
}
export function acceptanceErrors(
  state: CampaignState,
  selected: string | null,
) {
  const errors = [];
  if (!selected) errors.push("Select a creator.");
  if (!Object.values(state.checklist).every(Boolean))
    errors.push("Complete every delivery checklist item.");
  if (!state.passportReviewed) errors.push("Review the production passport.");
  if (
    !state.frames.length ||
    state.frames.some((f) => !["Approved", "Acknowledged"].includes(f.status))
  )
    errors.push("Review every campaign frame.");
  if (
    passportFindings(state.passport).some(
      (f) => !state.acknowledged.includes(f.key),
    )
  )
    errors.push("Acknowledge outstanding production information.");
  return errors;
}
export function safeNext(value: string | null, fallback = "/dashboard") {
  return value && /^\/(?!\/)/.test(value) && !/[\\\r\n]/.test(value)
    ? value
    : fallback;
}
export function inr(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}
