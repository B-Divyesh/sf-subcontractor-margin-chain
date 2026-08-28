export const chainFieldLimits = {
  name: { minimum: 2, maximum: 120 },
  contractingClient: { minimum: 2, maximum: 120 },
  endClient: { minimum: 0, maximum: 120 },
  approvedScope: { minimum: 4, maximum: 2_000 },
  clientCommitmentMinor: { minimum: 1, maximum: 100_000_000_00 },
  marginFloorBasisPoints: { minimum: 0, maximum: 10_000 },
  subcontractor: { minimum: 2, maximum: 120 },
  costRole: { minimum: 2, maximum: 120 },
  costMinor: { minimum: 0, maximum: 100_000_000_00 },
} as const;

export function isWithin(limit: { minimum: number; maximum: number }, value: number) {
  return Number.isSafeInteger(value) && value >= limit.minimum && value <= limit.maximum;
}
