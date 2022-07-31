import {
  Alert,
  Button,
  Calendar,
  Checkbox,
  Form,
  Input,
  Modal,
  Select,
} from "antd";
import { useEffect, useState } from "react";
import moment from "moment";
import Title from "antd/lib/typography/Title";
import { ethers } from "ethers";
const {
  constants: { AddressZero },
} = ethers;

const BookPromotionModal = promos => {
  const {
    showModal,
    handleOk,
    handleCancel,
    address,
    tx,
    readContracts,
    writeContracts,
    selectedDate,
  } = promos;
  const [form] = Form.useForm();

  const [initialValues, setInitialValues] = useState({
    remember: false,
    promotionDate: moment(),
    networkName: "mainnet",
    imageUrl: "",
  });
  useEffect(async () => {
    if (
      readContracts &&
      readContracts.Showcase &&
      readContracts.Showcase.promotions &&
      selectedDate
    ) {
      const promo = await readContracts.Showcase.promotions(
        selectedDate.unix(),
      );
      setInitialValues(originalValues => {
        const newValues = { ...originalValues, ...promo };
        if (
          newValues.nftContractAddress == AddressZero &&
          newValues.nftTokenId == 0
        ) {
          newValues.nftContractAddress = "";
          newValues.nftTokenId = "";
        }
        return newValues;
      });
    }
  }, [selectedDate, readContracts, readContracts && readContracts.Showcase]);

  useEffect(() => {
    form.resetFields();
  }, [initialValues]);
  const onFinish = async values => {
    console.log("*** Success:", values);
    const {
      nftContractAddress,
      nftTokenId,
      clickThruUrl,
      title,
      subTitle,
      networkName,
      imageUrl,
    } = values;
    try {
      let fn;
      if (!initialValues.promoter || initialValues.promoter == AddressZero) {
        fn = writeContracts.Showcase.addPromotion;
      } else {
        fn = writeContracts.Showcase.updatePromotion;
      }
      const result = await tx(
        fn([
          AddressZero,
          nftContractAddress,
          nftTokenId,
          clickThruUrl,
          0,
          selectedDate.unix(),
          title,
          subTitle,
          networkName,
          imageUrl,
          0,
        ]),
      );
      const receipt = await result.wait();
      console.log("*** receipt", receipt);
      setTxId(receipt.transactionHash);
      handleOk();
    } catch (e) {
      console.log("*** transaction cancelled: ", e);
    }
  };

  const onFinishFailed = errorInfo => {
    console.log("*** Failed:", errorInfo);
  };

  const [txId, setTxId] = useState(null);
  const [isApproved, setIsApproved] = useState(false);
  const [approvedAmount, setApprovedAmount] = useState(
    ethers.BigNumber.from(0),
  );
  useEffect(() => {
    const checkAndSetApprovalStatus = async () => {
      if (
        address &&
        address != AddressZero &&
        readContracts &&
        readContracts.USDC &&
        readContracts.Showcase
      ) {
        const myBalance = await readContracts.USDC.allowance(
          address,
          readContracts.Showcase.address,
        );
        if (myBalance.gte(1000_000_000)) {
          setIsApproved(true);
        } else {
          setIsApproved(false);
        }
        setApprovedAmount(myBalance);
      }
    };
    checkAndSetApprovalStatus();
  }, [
    address,
    readContracts,
    readContracts && readContracts.USDC,
    readContracts && readContracts.Showcase,
    txId,
  ]);

  const approve = async () => {
    const result = await tx(
      writeContracts.USDC.approve(
        writeContracts.Showcase.address,
        ethers.BigNumber.from(2).pow(256).sub(1),
      ),
    );
    if (result) {
      console.log("*** result: ", result);
      const receipt = await result.wait();
      console.log("*** receipt: ", result);
      setTxId(receipt.transactionHash);
    } else {
      console.error("*** failed to book");
    }
  };

  const submitButton = () => {
    let txt = "";
    if (!initialValues.promoter) {
      txt = "Transfer";
    } else if (initialValues.promoter == AddressZero) {
      txt = "Transfer";
    } else if (initialValues.promoter == address) {
      txt = "Update";
    } else if (address == process.env.REACT_APP_DEPLOYER_ADDRESS) {
      txt = "Admin Update";
    } else {
      txt = "";
    }
    return (
      <Button
        type="primary"
        htmlType="submit"
        disabled={!isApproved}
        style={{ margin: "0 8px" }}
      >
        {txt}
      </Button>
    );
  };

  return (
    <>
      <Modal
        title={`Book a Promotion to run on: ${selectedDate.format(
          "YYYY-MM-DD",
        )}`}
        visible={showModal}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={""}
        width={700}
      >
        <Form
          form={form}
          name="basic"
          labelCol={{ span: 8 }}
          // wrapperCol={{ span: 8 }}
          initialValues={initialValues}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
        >
          {initialValues.promoter && initialValues.promoter != AddressZero && <Form.Item
            label="Promoter"
            name="promoter"
          >
            <Input disabled={true} />
          </Form.Item>}

          <Form.Item
            label="NFT Contract Address"
            name="nftContractAddress"
            rules={[
              {
                required: true,
                message: "Please enter the NFT Contract Address!",
              },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="NFT Token Id"
            name="nftTokenId"
            rules={[
              { required: true, message: "Please enter the NFT Token Id!" },
            ]}
          >
            <Input style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            label="Title"
            name="title"
            rules={[{ required: true, message: "Please enter Title" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="SubTitle"
            name="subTitle"
            rules={[{ required: true, message: "Please enter Sub-Title" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Click-thru URL"
            name="clickThruUrl"
            rules={[
              { required: true, message: "Please enter the click-thru url!" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item label="Image Url" name="imageUrl">
            <Input />
          </Form.Item>

          <Form.Item
            label="Network Name"
            name="networkName"
            rules={[{ required: true, message: "Please select a network" }]}
          >
            <Select>
              <Select.Option value="mainnet">mainnet</Select.Option>
              <Select.Option value="polygon">polygon</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="remember"
            valuePropName="checked"
            rules={[
              {
                required: true,
                transform: value => value || undefined, // Those two lines
                type: "boolean", // Do the magic
                message: "Please agree the terms and conditions.",
              },
            ]}
            wrapperCol={{ offset: 8 }}
          >
            <Checkbox>
              I have read and agree to the{" "}
              <a href={"https://alphaback.xyz/tos.html"} target={"_blank"}>
                TOS
              </a>
            </Checkbox>
          </Form.Item>

          <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
            <Button type="primary" onClick={approve} disabled={isApproved}>
              Approve
            </Button>
            {submitButton()}
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default BookPromotionModal;
