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
import { usePromotion } from "../hooks";

const {
  constants: { AddressZero },
} = ethers;

const PlaceHolderText = props => {
  return (
    <div>
      PS: This is a placeholder NFT. We are actively looking for a promoter. If
      you know one, please send them{" "}
      <a href="https://app.alphaback.xyz/promotions" target={"_blank"}>
        this
      </a>{" "}
      way.
    </div>
  );
};

const PromotedText = props => {
  return (
    <div>
      PS: This is a <Text mark strong>promoted</Text> NFT. The promotion fees are
      distributed among the chrome extension install base.
    </div>
  );
};

export default function Showcase(props) {
  const { readContracts } = props;
  const { imageObj, promotionObj, inProgress } = usePromotion(readContracts);
  let imageUrl = "https://ipfs.io/ipfs/QmRRPWG96cmgTn2qSzjwr2qvfNEuhunv6FNeMFGa9bx6mQ";
  if (imageObj && imageObj.media && imageObj.media[0]) {
    if (imageObj.media[0].gateway) {
      imageUrl = imageObj.media[0].gateway;
    } else if (imageObj.media[0].raw) {
      imageUrl = imageObj.media[0].raw;
    }
  }
  console.log("*** imageObj: ", imageObj);
  console.log("*** imageUrl: ", imageUrl);

  if(inProgress === true){
    console.log("*** in Porgress right now. will show blank")
    return ""
  }

  return (
    <div style={{ padding: 16, width: 400, margin: "auto", marginTop: 64 }}>
      <a href={promotionObj.clickThruUrl}>
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
          {promotionObj.promoter == AddressZero && <PlaceHolderText />}
          {promotionObj.promoter != AddressZero && <PromotedText />}
        </Card>
      </a>
    </div>
  );
}
