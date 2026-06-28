export interface EsewaPaymentForm {
  amount: string;
  tax_amount: string;
  total_amount: string;
  transaction_uuid: string;
  product_code: string;
  product_service_charge: string;
  product_delivery_charge: string;
  success_url: string;
  failure_url: string;
  signed_field_names: string;
  signature: string;
}

export function submitEsewaPayment(paymentUrl: string, form: EsewaPaymentForm): void {
  const formEl = document.createElement("form");
  formEl.method = "POST";
  formEl.action = paymentUrl;

  for (const [name, value] of Object.entries(form)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    formEl.appendChild(input);
  }

  document.body.appendChild(formEl);
  formEl.submit();
}

export function formatNpr(amount: number): string {
  return new Intl.NumberFormat("en-NP", {
    style: "currency",
    currency: "NPR",
    maximumFractionDigits: 0,
  }).format(amount);
}
