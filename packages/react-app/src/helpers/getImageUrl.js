import axios from "axios";
import moment from "moment";

const ALCHEMY_KEY = process.env.REACT_APP_ALCHEMY_API_KEY;

const getFromLocalStorage = key => {
  try {
    let value = window.localStorage.getItem(key);
    if (value) {
      value = JSON.parse(value);
      if (value.expiration > moment().unix()) {
        return value.data;
      } else {
        window.localStorage.removeItem(key);
      }
      return "";
    }
  } catch (e) {
    return "";
  }
};

export const getImageUrl = async ({
  nftContractAddress,
  nftTokenId,
  networkName,
}) => {
  const key = `alchemy-nftImageUrl-${nftContractAddress}-${nftTokenId}`;
  const value = getFromLocalStorage(key);
  if (value) {
    console.log("*** using value from localStorage: ", value);
    return value;
  }

  let url;
  if (networkName == "polygon") {
    url = `https://polygon-mainnet.g.alchemy.com/nft/v2/${ALCHEMY_KEY}/getNFTMetadata?contractAddress=${nftContractAddress}&tokenId=${nftTokenId}`;
  } else if (networkName == "mainnet") {
    url = `https://eth-mainnet.alchemyapi.io/nft/v2/${ALCHEMY_KEY}/getNFTMetadata?contractAddress=${nftContractAddress}&tokenId=${nftTokenId}`;
  } else {
    return "";
  }

  try {
    const result = await axios({
      method: "get",
      url: url,
    });
    console.log("*** result: ", result);
    const value = result.data;
    console.log("*** storing value in localstorage: ", value);
    window.localStorage.setItem(
      key,
      JSON.stringify({
        expiration: moment().add(60, "minutes").unix(),
        data: value
      }),
    );
    return value;
  } catch (e) {
    console.error("error getting nft data: ", e);
    return "";
  }
};
