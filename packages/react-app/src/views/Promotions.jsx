import {
  Alert,
  Badge,
  Button,
  Calendar,
  Checkbox,
  Form,
  Input,
  InputNumber,
  Select,
} from "antd";
import { useEffect, useState } from "react";
import moment from "moment";
import { ethers } from "ethers";
const { constants } = ethers;

const Promotions = props => {
  const { address, writeContracts, readContracts, tx } = props;
  const [selectedDate, setSelectedDate] = useState(moment());
  const [form] = Form.useForm();
  window.form = form;
  window.ethers = ethers;
  const onFinish = async values => {
    console.log("*** Success:", values);
    const {
      promoter,
      nftContractAddress,
      nftTokenId,
      clickThruUrl,
      promotionDate,
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
          promotionDate.format("YYYY-MM-DD"),
          title,
          subTitle,
          networkName,
          imageUrl
        ]),
      );
      const receipt = await result;
      console.log("*** receipt", receipt);
      getBookedDates();
    } catch (e) {
      console.log("*** transaction cancelled: ", e);
    }
  };

  const onFinishFailed = errorInfo => {
    console.log("*** Failed:", errorInfo);
  };

  const initialValues = {
    remember: true,
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

  const onDateChange = value => {
    console.log("*** changing date to: ", value);
    form.setFieldsValue({ promotionDate: value });
    setSelectedDate(value);
  };

  // const onDateSelect = value => {
  //   console.log("*** selected date is: ", value);
  //   form.setFieldsValue({ promotionDate: value });
  // }

  const onPanelChange = (date, mode) => {
    console.log("*** panel changed: ", date, mode);
  };

  const dateCellRender = date => {
    console.log("*** rendering for date: ", date.format("YYYY-MM-DD"));
    const promo = dateToPromo[date.format("YYYY-MM-DD")];
    if (promo && promo.promoter != constants.AddressZero) {
      return (
        <ul className="events">
          <li>
            <Badge status={"error"} text={"Booked"} />
          </li>
        </ul>
      );
    }
  };

  const getBookedDates = async () => {
    if (readContracts && readContracts.Showcase && dateToPromo) {
      console.log("*** selectedDate: ", selectedDate.format("YYYY-MM-DD"));
      const m1 = selectedDate.clone();
      m1.date(1);
      const dates = [m1.format("YYYY-MM-DD")];
      console.log("*** m1 is: ", m1.format("YYYY-MM-DD"));
      [...Array(30)].forEach((item, idx) => {
        dates.push(m1.add(1, "days").format("YYYY-MM-DD"));
      });
      // console.log("*** dates: ", dates);
      console.log("*** get promotions: ");
      const promos = await readContracts.Showcase.getMultiplePromotions(dates);
      console.log("***got promotions: ", promos.length);
      const dateToPromo = {};
      dates.forEach((item, index) => {
        dateToPromo[item] = promos[index];
      });
      // console.log("*** dateToPromo: ", dateToPromo);
      setDateToPromo(dateToPromo);
    }
  };

  const [dateToPromo, setDateToPromo] = useState({});
  useEffect(() => {
    getBookedDates();
  }, [readContracts, selectedDate]);

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
  }, [address]);

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

        <Form.Item
          label="Image Url"
          name="imageUrl"
        >
          <Input/>
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

        {form.getFieldValue("promotionDate") && (
          <Form.Item label="Date to run promotion" name="promotionDate">
            <div className="site-calendar-demo-card">
              <Alert
                message={`You selected date: ${form
                  .getFieldValue("promotionDate")
                  .format("YYYY-MM-DD")}`}
              />
              <Calendar
                mode={"month"}
                fullscreen={false}
                onChange={onDateChange}
                // onSelect={onDateSelect}
                onPanelChange={onPanelChange}
                defaultValue={form.getFieldValue("promotionDate")}
                dateCellRender={dateCellRender}
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
