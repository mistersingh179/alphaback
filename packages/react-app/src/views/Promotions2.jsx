import { Badge, Calendar, Tag } from "antd";
import { useState } from "react";
import moment from "moment";
import { useDailyPrices } from "../hooks";
import { ethers } from "ethers";
import useDailyPromos from "../hooks/useDailyPromos";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import BookPromotionModal from "../components/BookPromotionModal";
const {
  constants: { AddressZero },
} = ethers;

const Promotions2 = props => {
  const { readContracts, writeContracts, address, tx } = props;
  const [selectedDate, setSelectedDate] = useState(moment().utc().startOf("day"));
  const dailyPricesHash = useDailyPrices(readContracts, selectedDate);
  const dailyPromosHash = useDailyPromos(readContracts, selectedDate);
  const [showModal, setShowModal] = useState(false);

  const handleOk = () => {
    console.log("*** in handleOk");
    setShowModal(false);
    setSelectedDate(selectedDate.clone()); // will cause refetch
  };
  const handleCancel = () => {
    setShowModal(false);
  };

  const headerRender = (date, type, onChange, onTypeChange) => {};

  const disabledDate = date => {
    const formattedDate = date.format("YYYY-MM-DD");
    if (
      dailyPromosHash[formattedDate] &&
      dailyPromosHash[formattedDate].promoter &&
      dailyPromosHash[formattedDate].promoter != AddressZero
    ) {
      return true;
    } else {
      return false;
    }
  };

  const onDateChange = date => {
    setSelectedDate(date.utc().startOf("day"));
    setShowModal(true);
  };

  const dateCellRender = date => {
    const dateInUnixSeconds = date.utc().startOf('day').unix();
    let cost = dailyPricesHash[dateInUnixSeconds];
    if (cost) {
      cost = ethers.utils.formatUnits(cost, 6);
    }
    let promo = dailyPromosHash[dateInUnixSeconds];
    let promoter;
    if (promo) {
      promoter = promo.promoter;
    }
    return (
      <ul className="events">
        {cost && (
          <li>
            <Badge status={"default"} text={"$" + cost} />
          </li>
        )}
        {promoter && promoter != AddressZero && (
          <li>
            <Tag icon={<CloseCircleOutlined />} color="error">
              Booked
            </Tag>
          </li>
        )}
        {!promoter ||
          (promoter == AddressZero && (
            <li>
              <Tag icon={<CheckCircleOutlined />} color="success">
                Available
              </Tag>
            </li>
          ))}
      </ul>
    );
  };

  const now = moment().utc().format();
  return (
    <>
      Now: {now}
      <Calendar
        style={{ padding: "0 50px" }}
        mode={"month"}
        fullscreen={true}
        // onChange={onDateChange}
        onSelect={onDateChange}
        defaultValue={selectedDate}
        dateCellRender={dateCellRender}
        disabledDate={disabledDate}
        // headerRender={headerRender}
      />
      <BookPromotionModal
        showModal={showModal}
        handleOk={handleOk}
        handleCancel={handleCancel}
        selectedDate={selectedDate}
        address={address}
        readContracts={readContracts}
        writeContracts={writeContracts}
        tx={tx}
      />
    </>
  );
};

export default Promotions2;
