// Playwright is installed by the automation owner later. Until then, this keeps
// the scaffold type-safe without requiring the `playwright` package today.
type Page = {
  $$(selector: string): Promise<unknown[]>;
  $(selector: string): Promise<{ isVisible?: () => Promise<boolean> } | null>;
};

type DynamicCountResult = {
  pass: boolean;
  actual: number;
  expected: number;
};

type ConditionalVisibilityResult = {
  pass: boolean;
  visible: boolean;
  state: Record<string, any>;
};

// Day 4 will use this helper after the database seeder creates app data.
// Example requirement: "6 scholarships loading dynamically from database".
export async function checkDynamicCount(
  page: Page,
  selector: string,
  expected: number,
): Promise<DynamicCountResult> {
  console.log(
    `[tier2Checks] checkDynamicCount scaffold - selector: ${selector}, expected: ${expected}`,
  );

  // Full Day 4 implementation should wait for dynamic content, count matches,
  // and return whether the seeded UI rendered the expected number of items.
  const actual = 0;

  console.log(
    `[tier2Checks] checkDynamicCount pending Day 4 logic - actual placeholder: ${actual}`,
  );

  return { pass: false, actual, expected };
}

// Day 4 will verify UI visibility after setting or reading application state.
// Example requirement: "Pay button visible only if pending + unpaid".
export async function checkConditionalVisibility(
  page: Page,
  selector: string,
  requiredState: Record<string, any>,
): Promise<ConditionalVisibilityResult> {
  console.log(
    `[tier2Checks] checkConditionalVisibility scaffold - selector: ${selector}`,
    requiredState,
  );

  // Full Day 4 implementation should apply/inspect requiredState, locate the
  // selector, and compare actual visibility with the expected condition.
  const visible = false;

  console.log(
    `[tier2Checks] checkConditionalVisibility pending Day 4 logic - visible placeholder: ${visible}`,
  );

  return { pass: false, visible, state: requiredState };
}
