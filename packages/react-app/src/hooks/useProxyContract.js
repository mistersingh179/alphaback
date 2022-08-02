import proxyContracts from "../contracts/proxy_contracts.json";
import { ethers } from "ethers";
import { useEffect, useState } from "react";

const useProxyContract = (
  contractName,
  localChainId,
  localProvider,
  userSigner,
) => {
  const [fooContract, setFooContract] = useState(null);

  useEffect(async () => {
    if (
      proxyContracts &&
      proxyContracts[localChainId] &&
      proxyContracts[localChainId][contractName] &&
      (localProvider || userSigner)
    ) {
      const FooContractInfo = proxyContracts[localChainId][contractName];
      const contract = new ethers.Contract(
        FooContractInfo.address,
        FooContractInfo.abi,
        userSigner || localProvider,
      );
      setFooContract(contract);
    }
  }, [proxyContracts, localChainId, localProvider, userSigner]);

  return fooContract;
};

export default useProxyContract;