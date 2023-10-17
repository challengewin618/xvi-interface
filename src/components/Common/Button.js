import cx from "classnames";
import "./Button.css";
import {IoMdWallet} from 'react-icons/io';

export default function Button({ href, imgSrc, children, imgName, onClick, className, size = "lg", align = "center", disabled = false }) {
  let classNames = cx("btn", className);
  if (onClick) {
    return (
      <button className={classNames} onClick={onClick} disabled={disabled}>
        {imgSrc ? (
          <>
            <img className="btn-image" src={imgSrc} alt={imgName} />
            <span className="btn-label">{children}</span>
          </>
        ) : (
          <>{children}</>
        )}
      </button>
    );
  }
  return (
    <a className={classNames} href={href} target="_blank" rel="noopener noreferrer">
      {imgSrc && <img className="btn-image" src={imgSrc} alt={imgName} />}
      <span className="btn-label">{children}</span>
    </a>
  );
}

export function ConnectWalletButton({ imgSrc, children, onClick, className = undefined }) {
  return (
    <button className="connect-wallet-btn" onClick={onClick}>
      {imgSrc && <IoMdWallet size={20}/>}
      <span className="btn-label">{children}</span>
    </button>
  );
}
