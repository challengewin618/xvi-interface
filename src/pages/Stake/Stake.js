import React from "react";

import {getConstant} from "../../config/chains";

import StakeV1 from "./StakeV1";
import StakeV2 from "./StakeV2";
import {BSC_TESTNET} from "../../lib/legacy";

export default function Stake(props) {
  const chainId = BSC_TESTNET;
  const isV2 = getConstant(chainId, "v2");
  return isV2 ? <StakeV2 {...props} /> : <StakeV1 {...props} />;
}
