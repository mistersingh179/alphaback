import moment from 'moment'

const getSeqDates = async (readContracts, address) => {
  try{
    if(readContracts && readContracts.Showcase && address){
      const lastPayoutDate = moment.unix((await readContracts.Showcase.getMembersLastPayoutDate([address]))[0]);
      // const startOfToday = moment.unix(await readContracts.Showcase.startOfToday());
      const startOfToday = moment().utc().startOf('day');
      const numOfDays = moment.duration(startOfToday.diff(lastPayoutDate)).as("days");
      const sequentialDates = [];
      for (let i = 1; i <= numOfDays; i++) {
        sequentialDates.push(lastPayoutDate.clone().add(i, "days").unix());
      }
      return sequentialDates;
    }
  }catch(e){
    console.error("*** error getting seq dates: ", e);
    return []
  }
}

export default getSeqDates;