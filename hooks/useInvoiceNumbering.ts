'use client';

import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invoiceNumberingApi } from '@/lib/api';
import { InvoiceNumberingConfig } from '@/types';
import { computeInvoiceNumberPreview, InvoiceNumberingDraft } from '@/lib/invoice-numbering';

const QUERY_KEY = ['invoice-numbering'];

export function useInvoiceNumberingConfig() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: invoiceNumberingApi.getConfig,
  });
}

export function useUpdateInvoiceNumberingConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: invoiceNumberingApi.updateConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useInvoiceNumberPreview(
  config?: InvoiceNumberingConfig,
  overrides?: InvoiceNumberingDraft & { sequence?: number }
) {
  return useMemo(() => {
    if (!config) return null;
    return computeInvoiceNumberPreview(
      { ...config, ...overrides, nextSequence: overrides?.sequence ?? overrides?.nextSequence ?? config.nextSequence },
      {
        sequence: overrides?.sequence ?? overrides?.nextSequence ?? config.nextSequence,
        prefixTemplate: overrides?.prefixTemplate ?? config.prefixTemplate,
        formatTemplate: overrides?.formatTemplate ?? config.formatTemplate,
        sequenceLength: overrides?.sequenceLength ?? config.sequenceLength,
      }
    );
  }, [config, overrides]);
}

