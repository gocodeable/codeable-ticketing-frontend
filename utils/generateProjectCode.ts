/**
 * Generates a project code from a title (client-side version)
 * Examples:
 * - "Test Project" -> "TEPR"
 * - "Kanban Board" -> "KABA"
 * - "E-Commerce Platform" -> "ECPL"
 * - "Task Management" -> "TAMA"
 * - "API" -> "API"
 */
export const generateProjectCode = (title: string): string => {
  if (!title || title.trim().length === 0) {
    return 'PROJ';
  }

  // Remove special characters and extra spaces
  const cleaned = title
    .trim()
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, ' ');

  // Split into words
  const words = cleaned.split(/[\s-]+/).filter(word => word.length > 0);

  if (words.length === 0) {
    return 'PROJ';
  }

  // If single word
  if (words.length === 1) {
    const word = words[0];
    if (word.length <= 4) {
      return word.toUpperCase();
    }
    // Take consonants first, then vowels if needed
    const consonants = word.match(/[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]/g) || [];
    const vowels = word.match(/[aeiouAEIOU]/g) || [];
    const chars = [...consonants, ...vowels];
    return chars.slice(0, 4).join('').toUpperCase() || word.slice(0, 4).toUpperCase();
  }

  // Helper function to get 2 letters from a word
  const getTwoLetters = (word: string): string => {
    if (word.length >= 2) {
      return word.slice(0, 2);
    }
    return word.slice(0, 1);
  };

  // Multiple words - take 2 letters from each word
  if (words.length <= 4) {
    const code = words
      .map(w => getTwoLetters(w))
      .join('')
      .toUpperCase();
    // Limit to 10 characters max
    return code.slice(0, 10);
  }

  // More than 4 words - prioritize longer/more important words
  const importantWords = words
    .filter(w => w.length > 2) // Skip short words like "a", "of", "in"
    .slice(0, 4);
  
  if (importantWords.length >= 2) {
    const code = importantWords
      .map(w => getTwoLetters(w))
      .join('')
      .toUpperCase();
    // Limit to 10 characters max
    return code.slice(0, 10);
  }

  // Fallback: just take first 4 words
  const code = words
    .slice(0, 4)
    .map(w => getTwoLetters(w))
    .join('')
    .toUpperCase();
  // Limit to 10 characters max
  return code.slice(0, 10);
};

/**
 * Validates if a project code is valid
 * Rules:
 * - 2-10 characters
 * - Only uppercase letters and numbers
 * - Must start with a letter
 */
export const isValidProjectCode = (code: string): boolean => {
  if (!code || code.length < 2 || code.length > 10) {
    return false;
  }
  
  // Must start with a letter and contain only uppercase letters and numbers
  return /^[A-Z][A-Z0-9]*$/.test(code);
};

