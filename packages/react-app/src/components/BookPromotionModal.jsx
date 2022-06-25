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
import { useState } from "react";
import moment from "moment";
import Title from 'antd/lib/typography/Title'

const BookPromotionModal = promos => {
  const {
    showModal,
    handleOk,
    handleCancel,
    address,
    tx,
    writeContracts,
    selectedDate,
  } = promos;
  const [form] = Form.useForm();

  const initialValues = {
    remember: false,
    promoter: address,
    // nftContractAddress: "0x05df72d911e52AB122f7d9955728BC96A718782C",
    // nftTokenId: 12370,
    // clickThruUrl: "https://google.com",
    promotionDate: moment(),
    // title: "foo",
    // subTitle: "foobar",
    networkName: "mainnet",
    imageUrl: "",
  };

  const onFinish = async values => {
    console.log("*** Success:", values);
    const {
      promoter,
      nftContractAddress,
      nftTokenId,
      clickThruUrl,
      title,
      subTitle,
      networkName,
      imageUrl,
    } = values;
    try {
      const result = tx(
        writeContracts.Showcase.addPromotion([
          promoter,
          nftContractAddress,
          nftTokenId,
          "https://" + clickThruUrl,
          0,
          selectedDate.format("YYYY-MM-DD"),
          title,
          subTitle,
          networkName,
          imageUrl,
        ]),
      );
      const receipt = await result;
      console.log("*** receipt", receipt);
      handleOk();
    } catch (e) {
      console.log("*** transaction cancelled: ", e);
    }
  };

  const onFinishFailed = errorInfo => {
    console.log("*** Failed:", errorInfo);
  };

  return (
    <>
      <Modal
        title={`Book a Promotion to run on: ${selectedDate.format("YYYY-MM-DD")}`}
        visible={showModal}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={""}
        width={700}
      >
        <Form
          form={form}
          name="basic"
          labelCol={{ span: 8}}
          // wrapperCol={{ span: 8 }}
          initialValues={initialValues}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
        >
          <Form.Item
            label="Promoter Address"
            name="promoter"
            rules={[
              {
                required: true,
                message: "Please enter the promoters Address!",
              },
            ]}
          >
            <Input />
          </Form.Item>

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
            rules={[{
              required: true,
              transform: value => (value || undefined),  // Those two lines
              type: 'boolean',                           // Do the magic
              message: 'Please agree the terms and conditions.',
            }]}
            wrapperCol={{ offset: 8 }}
          >
            <Checkbox>
              I have read and agree to the{" "}
              <a href={"https://alphaback.xyz/tos.html"} target={"_blank"}>
                TOS
              </a>
            </Checkbox>
          </Form.Item>

          <Form.Item wrapperCol={{ offset: 8 }}>
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default BookPromotionModal;
