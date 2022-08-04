import {
  Button,
  Card,
  DatePicker,
  Divider,
  Input,
  Progress,
  Skeleton,
  Slider,
  Spin,
  Switch,
} from "antd";
import React, { useEffect, useState } from "react";
import { utils } from "ethers";
import { SyncOutlined } from "@ant-design/icons";
import { ethers } from "ethers";

import { Address, Balance, Events } from "../components";
import moment from "moment";
import { getImageUrl } from "../helpers";
import Text from "antd/lib/typography/Text";
import { usePromotion, useMemberBalance } from "../hooks";
import { placeholderWallets } from "../constants";
import { Link } from "react-router-dom";
import baycImage from "../images/bayc1.jpg";

const {
  constants: { AddressZero },
} = ethers;

const BottomText = props => {
  const { promotionObj } = props;
  if (promotionObj.promoter && !placeholderWallets[promotionObj.promoter]) {
    return (
      <div>
        PS: This is a{" "}
        <Text mark strong>
          promoted
        </Text>{" "}
        NFT. The promotion fees are distributed among the chrome extension
        install base.
      </div>
    );
  } else {
    return (
      <div>
        PS: This is a placeholder NFT. We are actively looking for a promoter.
        If you know one,{" "}
        <Link to={"/promotions"}> please send them this way. </Link>{" "}
      </div>
    );
  }
};

export default function Showcase(props) {
  const { readContracts, address } = props;
  const { imageObj, promotionObj, inProgress } = usePromotion(readContracts);
  const memberBalance = useMemberBalance(readContracts, address);

  useEffect(() => {
    if (window && window.dataLayer && address) {
      // console.log("*** going to push: ", window.dataLayer, address);
      window.dataLayer.push({
        user_id: address,
        event: 'pageview',
      });
    }
  }, [window && window.dataLayer, address]);

  let imageUrl = baycImage;
  if (imageObj && imageObj.media && imageObj.media[0]) {
    if (imageObj.media[0].gateway) {
      imageUrl = imageObj.media[0].gateway;
    } else if (imageObj.media[0].raw) {
      imageUrl = imageObj.media[0].raw;
    }
  }
  console.log("*** imageObj: ", imageObj);
  console.log("*** imageUrl: ", imageUrl);

  if (inProgress === true) {
    console.log("*** in Porgress right now. will show blank");
    return "";
  }

  return (
    <div style={{ padding: 16, width: 400, margin: "auto", marginTop: 64 }}>
      <a
        href={
          promotionObj.clickThruUrl ? promotionObj.clickThruUrl : "/promotions"
        }
      >
        <Card
          hoverable
          cover={imageUrl && <img src={imageUrl} />}
          bordered={false}
        >
          <Card.Meta
            title={promotionObj.title}
            description={promotionObj.subTitle}
          />
          <Divider />
          <BottomText promotionObj={promotionObj} />
        </Card>
      </a>
    </div>
  );
}
