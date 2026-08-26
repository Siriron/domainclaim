// DomainClaim — contract method registry.
//
// Kept as a single source of truth for method names so components and
// the useGenLayer hook never hardcode a string that could drift from
// the deployed contract's real method names.

export const READ_METHODS = {
  getClaim: 'get_claim',
  getChallenge: 'get_challenge',
  getClaimsForDomain: 'get_claims_for_domain',
  isPairPermanentlyVoided: 'is_pair_permanently_voided',
  getVerificationInstructions: 'get_verification_instructions',
  getNextClaimId: 'get_next_claim_id',
  getNextChallengeId: 'get_next_challenge_id',
} as const;

export const WRITE_METHODS = {
  fileClaim: 'file_claim',
  resolveClaim: 'resolve_claim',
  challengeClaim: 'challenge_claim',
  resolveChallenge: 'resolve_challenge',
  finalizeClaim: 'finalize_claim',
} as const;

const DOMAIN_CLAIM_METHODS = { ...READ_METHODS, ...WRITE_METHODS };

export default DOMAIN_CLAIM_METHODS;
