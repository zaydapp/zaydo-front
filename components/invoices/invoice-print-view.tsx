'use client';

import { useTranslation } from 'react-i18next';
import { Invoice } from '@/types';
import { useCurrency } from '@/hooks/use-currency';
import { format } from 'date-fns';

interface InvoicePrintViewProps {
  invoice: Invoice;
}

export function InvoicePrintView({ invoice }: InvoicePrintViewProps) {
  const { t } = useTranslation();
  const { format: formatCurrency } = useCurrency();

  const formatDate = (date: string | Date) => {
    return format(new Date(date), 'dd.MM.yyyy');
  };

  // TODO: Get tenant data from context or API
  const tenant = {
    name: 'Mon Entreprise',
    address: '22, Avenue Voltaire',
    city: 'Marseille',
    postalCode: '13000',
    country: 'France',
    phone: '+33 4 92 99 99 99',
    email: '',
    website: '',
    vatNumber: '',
    bankName: '',
    bankIban: '',
    bankSwift: '',
  };

  return (
    <div
      className="bg-white print:bg-white w-[210mm] mx-auto"
      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
    >
      {/* Header Section with Orange Background */}
      <div className="bg-[#E67E22] px-12 py-8 flex justify-between items-start">
        {/* Company Info */}
        <div className="text-white">
          <h2 className="text-2xl font-bold mb-2">{tenant.name}</h2>
          <div className="text-sm space-y-0.5 opacity-95">
            {tenant.address && <p>{tenant.address}</p>}
            <p>{[tenant.postalCode, tenant.city].filter(Boolean).join(' ')}</p>
            {tenant.country && <p>{tenant.country}</p>}
            {tenant.phone && <p>Téléphone : {tenant.phone}</p>}
          </div>
        </div>

        {/* Invoice Title */}
        <div className="text-right">
          <h1 className="text-6xl font-bold text-white tracking-tight">FACTURE</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-12 py-8">
        {/* Client & Invoice Details Row */}
        <div className="flex justify-between mb-12">
          {/* Client Information */}
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-3">Client :</h3>
            <div className="text-sm text-gray-900 leading-relaxed">
              <p className="font-semibold">{invoice.client?.name}</p>
              {invoice.client?.address && <p>{invoice.client.address}</p>}
              <p>
                {[invoice.client?.postalCode, invoice.client?.city, invoice.client?.country]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            </div>
          </div>

          {/* Invoice Details Box */}
          <div className="w-[350px]">
            <div className="border border-gray-300 rounded p-5">
              <div className="space-y-2.5">
                <div className="grid grid-cols-[150px_1fr] gap-x-4 text-sm">
                  <span className="text-gray-700">Date :</span>
                  <span className="font-medium text-gray-900 text-right">
                    {formatDate(invoice.issueDate)}
                  </span>
                </div>
                <div className="grid grid-cols-[150px_1fr] gap-x-4 text-sm">
                  <span className="text-gray-700">Numéro de facture :</span>
                  <span className="font-medium text-gray-900 text-right">
                    {invoice.invoiceNumber}
                  </span>
                </div>
                <div className="grid grid-cols-[150px_1fr] gap-x-4 text-sm">
                  <span className="text-gray-700">Paiement :</span>
                  <span className="font-medium text-gray-900 text-right">
                    {invoice.paymentTerms || 'Net 30'}
                  </span>
                </div>
                {invoice.order && (
                  <div className="grid grid-cols-[150px_1fr] gap-x-4 text-sm">
                    <span className="text-gray-700">Référence :</span>
                    <span className="font-medium text-gray-900 text-right">
                      {invoice.order.orderNumber}
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-[150px_1fr] gap-x-4 text-sm">
                  <span className="text-gray-700">Échéance :</span>
                  <span className="font-medium text-gray-900 text-right">
                    {formatDate(invoice.dueDate)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        {(invoice.notes || invoice.termsConditions) && (
          <div className="mb-8">
            <h3 className="font-semibold text-gray-900 mb-2">Informations additionnelles :</h3>
            <div className="text-sm text-gray-700">
              {invoice.notes && <p className="mb-1">{invoice.notes}</p>}
              {invoice.termsConditions && <p>{invoice.termsConditions}</p>}
            </div>
          </div>
        )}

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#E67E22] text-white">
                <th className="text-left py-3 px-4 text-sm font-semibold">Description</th>
                <th className="text-center py-3 px-4 text-sm font-semibold w-24">Quantité</th>
                <th className="text-center py-3 px-4 text-sm font-semibold w-20">Unité</th>
                <th className="text-right py-3 px-4 text-sm font-semibold w-32">
                  Prix unitaire HT
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold w-20">% TVA</th>
                <th className="text-right py-3 px-4 text-sm font-semibold w-28">Total TVA</th>
                <th className="text-right py-3 px-4 text-sm font-semibold w-32">Total TTC</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items?.map((item, index) => {
                const quantity = parseFloat(item.quantity?.toString() || '0');
                const unitPrice = parseFloat(item.unitPrice?.toString() || '0');
                const taxRate = parseFloat(item.taxRate?.toString() || '0');
                const subtotal = quantity * unitPrice;
                const taxAmount = subtotal * (taxRate / 100);
                const totalLine = subtotal + taxAmount;

                return (
                  <tr
                    key={item.id}
                    className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  >
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {item.description}
                      {item.notes && <div className="text-xs text-gray-500 mt-1">{item.notes}</div>}
                    </td>
                    <td className="py-3 px-4 text-sm text-center text-gray-900">{quantity}</td>
                    <td className="py-3 px-4 text-sm text-center text-gray-900">
                      {item.unit || 'unités'}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-gray-900">
                      {formatCurrency(unitPrice)}
                    </td>
                    <td className="py-3 px-4 text-sm text-center text-gray-900">{taxRate} %</td>
                    <td className="py-3 px-4 text-sm text-right text-gray-900">
                      {formatCurrency(taxAmount)}
                    </td>
                    <td className="py-3 px-4 text-sm text-right font-medium text-gray-900">
                      {formatCurrency(totalLine)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="flex justify-end mt-12 mb-16">
          <div className="w-[400px]">
            <div className="space-y-3">
              {/* Subtotal */}
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-medium text-gray-700">Total HT</span>
                <span className="text-base font-medium text-gray-900">
                  {formatCurrency(parseFloat(invoice.subtotal?.toString() || '0'))}
                </span>
              </div>

              {/* Discount */}
              {invoice.discountAmount && parseFloat(invoice.discountAmount.toString()) > 0 && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-gray-700">Remise</span>
                  <span className="text-base font-medium text-red-600">
                    -{formatCurrency(parseFloat(invoice.discountAmount.toString()))}
                  </span>
                </div>
              )}

              {/* Tax */}
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-medium text-gray-700">Total TVA</span>
                <span className="text-base font-medium text-gray-900">
                  {formatCurrency(parseFloat(invoice.taxAmount?.toString() || '0'))}
                </span>
              </div>

              {/* Total TTC - Highlighted */}
              <div className="flex justify-between items-center py-3 border-t-2 border-gray-300 mt-2">
                <span className="text-lg font-bold text-[#E67E22]">Total TTC</span>
                <span className="text-2xl font-bold text-[#E67E22]">
                  {formatCurrency(parseFloat(invoice.totalAmount?.toString() || '0'))}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Status Badge */}
        {invoice.status === 'PAID' &&
          invoice.paidAmount &&
          parseFloat(invoice.paidAmount.toString()) > 0 && (
            <div className="mb-8 p-4 bg-green-50 border-l-4 border-green-500 rounded">
              <p className="text-sm font-semibold text-green-800">
                ✓ Facture payée le {invoice.paidAt ? formatDate(invoice.paidAt) : ''}
              </p>
              <p className="text-sm text-green-700 mt-1">
                Montant réglé : {formatCurrency(parseFloat(invoice.paidAmount.toString()))}
              </p>
            </div>
          )}
      </div>

      {/* Footer with Orange Background */}
      <div className="bg-[#E67E22] px-12 py-6 mt-auto">
        <div className="text-white text-xs">
          {/* Order Number */}
          {invoice.order && (
            <div className="mb-4">
              <p className="font-semibold">Numéro de commande : {invoice.order.orderNumber}</p>
            </div>
          )}

          {/* Three Columns */}
          <div className="grid grid-cols-3 gap-8">
            {/* Company Details */}
            <div>
              <h4 className="font-semibold mb-2">{tenant.name}</h4>
              <div className="opacity-90 space-y-0.5">
                {tenant.address && <p>{tenant.address}</p>}
                <p>{[tenant.postalCode, tenant.city].filter(Boolean).join(' ')}</p>
                {tenant.vatNumber && <p>N° TVA Intra : {tenant.vatNumber}</p>}
              </div>
            </div>

            {/* Coordinator Details */}
            <div>
              <h4 className="font-semibold mb-2">Coordonnées</h4>
              <div className="opacity-90 space-y-0.5">
                {tenant.name && <p>{tenant.name}</p>}
                {tenant.phone && <p>Téléphone : {tenant.phone}</p>}
                {tenant.email && <p>E-mail : {tenant.email}</p>}
                {tenant.website && <p>{tenant.website}</p>}
              </div>
            </div>

            {/* Bank Details */}
            {(tenant.bankName || tenant.bankIban || tenant.bankSwift) && (
              <div>
                <h4 className="font-semibold mb-2">Détails bancaires</h4>
                <div className="opacity-90 space-y-0.5">
                  {tenant.bankName && <p>Banque : {tenant.bankName}</p>}
                  {tenant.bankSwift && <p>SWIFT/BIC : {tenant.bankSwift}</p>}
                  {tenant.bankIban && <p>IBAN : {tenant.bankIban}</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
