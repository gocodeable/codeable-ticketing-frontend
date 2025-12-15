/**
 * Validates if an email belongs to the allowed domain
 * @param email - The email address to validate
 * @returns true if email ends with @gocodeable.com
 */
export const isValidEmailDomain = (email: string | null | undefined): boolean => {
  if (!email) return false;
  return email.toLowerCase().endsWith("@gocodeable.com");
};

/**
 * Gets the error message for invalid email domain
 */
export const getEmailDomainError = (): string => {
  return "Only @gocodeable.com email addresses are allowed.";
};

