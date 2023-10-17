import { useEffect, useRef, useState } from "react";
import { Trans, t } from "@lingui/macro";
import cx from "classnames";
import { ARBITRUM, helperToast, useDebounce } from "../../lib/legacy";
import { getCodeError, getReferralCodeTakenStatus, getSampleReferrarStat } from "./referralsHelper";
import { useWeb3React } from "@web3-react/core";
import KeyIcon from '../../img/referral_key_icon.png';
import WalletIcon from '../../img/wallet_icon.png';

function AddAffiliateCode({
  handleCreateReferralCode,
  active,
  connectWallet,
  setRecentlyAddedCodes,
  recentlyAddedCodes,
}) {
  return (
    <div className="referral-card">
      <div className="referral-card-header">
        <img src={KeyIcon} width={48} height={48}/>
        <div className="referral-card-title">
          <div className="referral-card-main-title"><Trans>Affiliates</Trans></div>
          <div className="referral-card-sub-title"><Trans>Lorem Ipsum is simply dummy text of the printing</Trans></div>
        </div>
      </div>
      <div className="referral-card-body">
      <h2 className="title">
        <Trans>Generate Referral Code</Trans>
      </h2>
      <p className="sub-title">
        <Trans>
          Looks like you don't have a referral code to share. <br /> Create one now and start earning rebates!
        </Trans>
      </p>
      <div className="card-action">
        {active ? (
          <AffiliateCodeForm
            handleCreateReferralCode={handleCreateReferralCode}
            recentlyAddedCodes={recentlyAddedCodes}
            setRecentlyAddedCodes={setRecentlyAddedCodes}
          />
        ) : (
          <button className="App-button-option-light Exchange-swap-button" type="submit" onClick={connectWallet}>
            <img src={WalletIcon}/>
            <Trans>Connect Wallet</Trans>
          </button>
        )}
        </div>
      </div>
    </div>
  );
}

export function AffiliateCodeForm({
  handleCreateReferralCode,
  recentlyAddedCodes,
  setRecentlyAddedCodes,
  callAfterSuccess,
}) {
  const [referralCode, setReferralCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef("");
  const [referralCodeCheckStatus, setReferralCodeCheckStatus] = useState("ok");
  const debouncedReferralCode = useDebounce(referralCode, 300);
  const { account, chainId } = useWeb3React();
  useEffect(() => {
    inputRef.current.focus();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const checkCodeTakenStatus = async () => {
      if (error) {
        setReferralCodeCheckStatus("ok");
        return;
      }
      const { status: takenStatus } = await getReferralCodeTakenStatus(account, debouncedReferralCode, chainId);
      // ignore the result if the referral code to check has changed
      if (cancelled) {
        return;
      }
      if (takenStatus === "none") {
        setReferralCodeCheckStatus("ok");
      } else {
        setReferralCodeCheckStatus("taken");
      }
    };
    setReferralCodeCheckStatus("checking");
    checkCodeTakenStatus();
    return () => {
      cancelled = true;
    };
  }, [account, debouncedReferralCode, error, chainId]);

  function getButtonError() {
    if (!debouncedReferralCode) {
      return t`Enter a code`;
    }
    if (referralCodeCheckStatus === "taken") {
      return t`Code already taken`;
    }
    if (referralCodeCheckStatus === "checking") {
      return t`Checking code...`;
    }

    return false;
  }

  const buttonError = getButtonError();

  function getPrimaryText() {
    if (buttonError) {
      return buttonError;
    }

    if (isProcessing) {
      return t`Creating...`;
    }

    return t`Create`;
  }
  function isPrimaryEnabled() {
    if (buttonError) {
      return false;
    }
    if (error || isProcessing) {
      return false;
    }
    return true;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsProcessing(true);
    const { status: takenStatus, info: takenInfo } = await getReferralCodeTakenStatus(account, referralCode, chainId);
    if (["all", "current", "other"].includes(takenStatus)) {
      setIsProcessing(false);
    }

    if (takenStatus === "none" || takenStatus === "other") {
      const ownerOnOtherNetwork = takenInfo[chainId === ARBITRUM ? "ownerAvax" : "ownerArbitrum"];
      try {
        const tx = await handleCreateReferralCode(referralCode);
        if (callAfterSuccess) {
          callAfterSuccess();
        }
        const receipt = await tx.wait();
        if (receipt.status === 1) {
          recentlyAddedCodes.push(getSampleReferrarStat(referralCode, ownerOnOtherNetwork, account));

          helperToast.success("Referral code created!");
          setRecentlyAddedCodes(recentlyAddedCodes);
          setReferralCode("");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsProcessing(false);
      }
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        ref={inputRef}
        value={referralCode}
        disabled={isProcessing}
        className={cx("text-input", { "mb-sm": !error })}
        placeholder="Enter a code"
        onChange={({ target }) => {
          const { value } = target;
          setReferralCode(value);
          setError(getCodeError(value));
        }}
      />
      {error && <p className="error">{error}</p>}
      <button className="App-button-option-light Exchange-swap-button" type="submit" disabled={!isPrimaryEnabled()}>
        {getPrimaryText()}
      </button>
    </form>
  );
}

export default AddAffiliateCode;
