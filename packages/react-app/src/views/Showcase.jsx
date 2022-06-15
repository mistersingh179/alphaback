import { Button, Card, DatePicker, Divider, Input, Progress, Slider, Spin, Switch } from "antd";
import React, { useState } from "react";
import { utils } from "ethers";
import { SyncOutlined } from "@ant-design/icons";

import { Address, Balance, Events } from "../components";

const NoNftBox = props => {
  return (
    <div style={{ border: "1px solid #cccccc", padding: 16, width: 400, margin: "auto", marginTop: 64 }}>
      No Promoted Nft here yet, but when we have a promoted NFT, it will show here.
      <Divider />
      Connect your wallet so that we can send you your share of the funds we get from the promoter for displaying their
      NFT.
      <Divider />
      PS: We are in active search for someone who wants to pay & promote their NFT. If you know someone who wants to
      promote their NFT, please encourage them to use our{" "}
      <a href="https://alphaback.xyz/promote.html">self serve smart contract</a> to promote their NFT here.
      <Divider />
      WAGMI
    </div>
  );
};

const YesNftBox = props => {
  return (
    <div style={{ padding: 16, width: 400, margin: "auto", marginTop: 64 }}>
      <Card
        cover={
          <img
            alt="example"
            src="https://img.seadn.io/files/a0255505b78cae1b52485c3c0cd62d29.png?fit=max&auto=format&w=600"
          />
        }
        bordered={true}
      >
        <Card.Meta title="BAYC" description="https://opensea.io/BAYC" />
      </Card>
    </div>
  );
};

export default function Showcase(props) {
  return (
    <div>
      <NoNftBox />
    </div>
  );
}
