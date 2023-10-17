import { formatAmount, USD_DECIMALS } from "../../lib/legacy";

export default function TooltipCard({
  title,
  total,
  arbitrum,
  showDollar = true,
  decimalsForConversion = USD_DECIMALS,
}) {
  return (
    <>
      <p className="Tooltip-row">
        <span className="label">{title} on Binance:</span>
        <span className="amount">
          {showDollar && "$"}
          {formatAmount(arbitrum, decimalsForConversion, 0, true)}
        </span>
      </p>
      <div className="Tooltip-divider" />
      <p className="Tooltip-row">
        <span className="label">Total:</span>
        <span className="amount">
          {showDollar && "$"}
          {formatAmount(total, decimalsForConversion, 0, true)}
        </span>
      </p>
    </>
  );
}

export function TooltipCardRow({ label, amount, showDollar = true }) {
  return (
    <p className="Tooltip-row">
      <span className="label">{label}:</span>
      <span className="amount">
        {showDollar && "$"}
        {amount}
      </span>
    </p>
  );
}
