import {
  Alert,
  Button,
  Calendar,
  Checkbox,
  Form,
  Input,
  InputNumber,
} from "antd";
import { useEffect, useState } from "react";
import moment from "moment";

const Promotions = props => {
  const { address, writeContracts, tx } = props;

  const [form] = Form.useForm();
  window.form = form;

  const onFinish = async values => {
    console.log("Success:", values);
    const {
      promoter,
      nftContractAddress,
      nftTokenId,
      clickThruUrl,
      promotionDate,
    } = values;
    const result = await tx(
      writeContracts.Showcase.addPromotion([
        promoter,
        nftContractAddress,
        nftTokenId,
        clickThruUrl,
        0,
        promotionDate.format("YYYY-MM-DD"),
      ]),
    );
    const receipt = await result.wait();
    console.log(receipt);
  };

  const onFinishFailed = errorInfo => {
    console.log("Failed:", errorInfo);
  };

  const initialValues = {
    remember: true,
    promoter: address,
    promotionDate: moment(),
  };

  const onDateChange = value => {
    console.log("*** changing date to: ", value);
    form.setFieldsValue({ promotionDate: value });
  };

  const layout = {
    labelCol: {
      span: 8,
    },
    wrapperCol: {
      span: 16,
    },
  };
  const tailLayout = {
    wrapperCol: {
      offset: 8,
      span: 16,
    },
  };

  useEffect(() => {
    console.log("*** resettig fields");
    form.resetFields();
  }, [props.initialValues]);

  return (
    <>
      <Form
        form={form}
        name="basic"
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 8 }}
        initialValues={initialValues}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        autoComplete="off"
      >
        <Form.Item
          label="Promoter Address"
          name="promoter"
          rules={[
            { required: true, message: "Please enter the promoters Address!" },
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
          <InputNumber style={{ width: "100%" }} />
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

        {form.getFieldValue("promotionDate") && (
          <Form.Item label="Date to run promotion" name="promotionDate">
            <div className="site-calendar-demo-card">
              <Alert
                message={`You selected date: ${form
                  .getFieldValue("promotionDate")
                  .format("YYYY-MM-DD")}`}
              />
              <Calendar
                fullscreen={false}
                onChange={onDateChange}
                defaultValue={form.getFieldValue("promotionDate")}
              />
            </div>
          </Form.Item>
        )}

        <Form.Item
          name="remember"
          valuePropName="checked"
          wrapperCol={{ offset: 8, span: 8 }}
        >
          <Checkbox>I have read and agree to the TOS</Checkbox>
        </Form.Item>

        <Form.Item wrapperCol={{ offset: 8, span: 8 }}>
          <Button type="primary" htmlType="submit">
            Submit
          </Button>
        </Form.Item>
      </Form>
    </>
  );
};

export default Promotions;
