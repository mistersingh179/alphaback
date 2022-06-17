import { useEffect, useState } from "react";
import moment from "moment";
import { getImageUrl } from "../helpers";

const usePromotion = readContracts => {
  const [imageObj, setImageObj] = useState({});
  const [promotionObj, setPromotionObj] = useState({});
  const [inProgress, setInProgress] = useState(true);
  useEffect(() => {
    const getPromotion = async () => {
      if (readContracts && readContracts.Showcase) {
        try {
          setInProgress(true);
          const now = moment().format("YYYY-MM-DD");
          console.log("*** reading promotion for: ", now);
          const result = await readContracts.Showcase.promotions(now);
          const {
            clickThruUrl,
            nftContractAddress,
            nftTokenId,
            amount,
            promoter,
            networkName,
          } = result;
          setPromotionObj(result);
          console.log("*** promotion object: ", result);

          const resultImageObj = await getImageUrl({
            nftContractAddress,
            nftTokenId,
            networkName,
          });
          console.log("*** resultImageObj: ", resultImageObj);
          setImageObj(resultImageObj);
        } catch (e) {
          console.error("unable to get promotion: ", e);
        } finally {
          setInProgress(false);
        }
      }
    };
    getPromotion();
  }, [readContracts, readContracts && readContracts.Showcase]);
  return { imageObj, promotionObj, inProgress };
};

export default usePromotion;
