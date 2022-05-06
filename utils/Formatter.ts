export function formatRupiah(amount: number) {
  return `Rp${new Intl.NumberFormat("id-ID", {
    maximumSignificantDigits: 3,
  }).format(amount)}`;
}
