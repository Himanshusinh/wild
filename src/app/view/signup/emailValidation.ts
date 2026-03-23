export const SIGNUP_EMAIL_REGEX =
  /^[A-Za-z0-9]+(?:[._-][A-Za-z0-9]+)*@[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*(?:\.[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*)*\.[A-Za-z]{2,}$/;

export function isValidSignupEmail(email: string): boolean {
  const value = email.trim();
  if (!value) return false;
  if ((value.match(/@/g) || []).length !== 1) return false;

  const [localPart, domainPart] = value.split('@');
  if (!localPart || !domainPart) return false;
  if (localPart.startsWith('.') || localPart.endsWith('.')) return false;
  if (localPart.startsWith('_') || localPart.endsWith('_')) return false;
  if (localPart.startsWith('-') || localPart.endsWith('-')) return false;
  if (domainPart.includes('_')) return false;
  if (domainPart.startsWith('.') || domainPart.endsWith('.')) return false;
  if (domainPart.includes('..')) return false;

  return SIGNUP_EMAIL_REGEX.test(value);
}
