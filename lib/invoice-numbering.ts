import { InvoiceNumberingConfig, InvoiceNumberingResetFrequency } from '@/types';

const DEFAULT_PREFIX_TEMPLATE = 'INV-{YYYY}';
const DEFAULT_FORMAT_TEMPLATE = '{PREFIX}-{YYYY}-{SEQ}';
const DEFAULT_SEQUENCE_LENGTH = 3;

const TOKEN_REGEX = /\{([A-Z]+)\}/g;

export interface InvoiceNumberingPreviewResult {
  value: string;
  resolvedPrefix: string;
  sequence: number;
  errors: string[];
  warnings: string[];
}

export type InvoiceNumberingDraft = Partial<
  Pick<
    InvoiceNumberingConfig,
    | 'prefixTemplate'
    | 'formatTemplate'
    | 'sequenceLength'
    | 'resetFrequency'
    | 'nextSequence'
    | 'allowManualOverride'
  >
>;

export const INVOICE_NUMBERING_TOKENS: Array<{ token: string; description: string }> = [
  { token: '{PREFIX}', description: 'Resolved prefix (after placeholder substitution)' },
  { token: '{YYYY}', description: 'Full year (2025)' },
  { token: '{YY}', description: 'Short year (25)' },
  { token: '{MM}', description: 'Month (01-12)' },
  { token: '{DD}', description: 'Day (01-31)' },
  { token: '{SEQ}', description: 'Zero-padded running sequence' },
];

const clampSequenceLength = (value?: number) => {
  if (!value || Number.isNaN(value)) return DEFAULT_SEQUENCE_LENGTH;
  return Math.min(10, Math.max(1, Math.trunc(value)));
};

const formatSequence = (sequence: number, length: number) => {
  const safeSeq = Math.max(0, sequence);
  return safeSeq.toString().padStart(length, '0');
};

const getDateTokens = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return {
    YYYY: year.toString(),
    YY: year.toString().slice(-2),
    MM: month.toString().padStart(2, '0'),
    DD: day.toString().padStart(2, '0'),
  };
};

const renderTemplate = (template: string, replacements: Record<string, string>) => {
  if (!template) return '';
  return template.replace(TOKEN_REGEX, (match, token) => {
    if (replacements[token]) {
      return replacements[token];
    }
    return match;
  });
};

export const describeResetFrequency = (reset: InvoiceNumberingResetFrequency) => {
  switch (reset) {
    case 'NEVER':
      return 'Sequence never resets automatically.';
    case 'MONTHLY':
      return 'Sequence resets on the first day of each month.';
    case 'YEARLY':
    default:
      return 'Sequence resets on January 1st every year.';
  }
};

export function computeInvoiceNumberPreview(
  config?: InvoiceNumberingDraft,
  overrides?: {
    date?: Date;
    sequence?: number;
    prefixTemplate?: string;
    formatTemplate?: string;
    sequenceLength?: number;
  }
): InvoiceNumberingPreviewResult {
  const baseDate = overrides?.date ?? new Date();
  const dateTokens = getDateTokens(baseDate);
  const prefixTemplate =
    overrides?.prefixTemplate ?? config?.prefixTemplate ?? DEFAULT_PREFIX_TEMPLATE;
  const formatTemplate =
    overrides?.formatTemplate ?? config?.formatTemplate ?? DEFAULT_FORMAT_TEMPLATE;
  const sequenceLength = clampSequenceLength(overrides?.sequenceLength ?? config?.sequenceLength);
  const sequence = overrides?.sequence ?? config?.nextSequence ?? 1;
  const resolvedPrefix = renderTemplate(prefixTemplate, dateTokens) || 'INV';

  const tokens = {
    ...dateTokens,
    PREFIX: resolvedPrefix,
    SEQ: formatSequence(sequence, sequenceLength),
  };

  const value = renderTemplate(formatTemplate, tokens);
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!formatTemplate.includes('{SEQ}')) {
    errors.push('Format template must include the {SEQ} placeholder.');
  }

  if (!prefixTemplate.trim()) {
    errors.push('Prefix template cannot be empty.');
  }

  if (!resolvedPrefix.trim()) {
    warnings.push('Prefix template resolves to an empty value with the current date.');
  }

  if (!formatTemplate.includes('{PREFIX}')) {
    warnings.push('Format template does not inject the prefix. Consider adding {PREFIX}.');
  }

  if (sequenceLength < 1 || sequenceLength > 10) {
    errors.push('Sequence length must be between 1 and 10 digits.');
  }

  return {
    value,
    resolvedPrefix,
    sequence,
    errors,
    warnings,
  };
}

export function validateInvoiceNumberingDraft(draft: InvoiceNumberingDraft) {
  return computeInvoiceNumberPreview(draft);
}
