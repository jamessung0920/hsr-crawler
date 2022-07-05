import constants from '../constants';
import userWishTicket from '../repository/userWishTicket';

function getAllInstruction() {
  return [
    {
      type: 'text',
      text: '此bot可方便您查詢以及關注您需要的票，結果來自各大網站，這裡會一併統整給您。\n\n\n- 查詢車票 -\n會詢問您想要查詢的車票，請依照指定格式填入車票資訊。\n\n\n- 關注車票 -\n可預先填入您想要的車票，若有相關車票符合您的期待時，將會傳送訊息通知您。\n\n\n- 關注列表 -\n可查詢您目前所有關注的車票資訊。\n\n⚠️注意⚠️: 此bot並不提供訂票搶票功能。',
    },
  ];
}

function getSearchActionInstruction() {
  return [
    {
      type: 'text',
      text: `請輸入您想要查詢的車票資訊。\n\n⚠️注意⚠️: 高鐵官網目前起訖站支援的車站有: ${constants.OFFICIAL.STATIONS.join(
        ', ',
      )}\n\n格式為: 起站-迄站 日期 時間 張數`,
    },
    {
      type: 'text',
      text: '可參考以下範例:',
    },
    {
      type: 'text',
      text: '台北-台中 2022-06-20 09:00 1張',
    },
  ];
}

function getFollowActionInstruction() {
  return [
    {
      type: 'text',
      text: '請預先填入您想要的車票，會在未來有車票時通知您。\n\n⚠️注意⚠️: 最多關注三組，若再往上追加關注，會將舊的關注刪除掉，可至關注列表查詢。\n\n格式為: 起站-迄站 日期 時間 張數',
    },
    {
      type: 'text',
      text: '可參考以下範例:',
    },
    {
      type: 'text',
      text: '台北-台中 2022-06-20 09:00 1張',
    },
  ];
}

async function getFollowListActionInstruction(pgPool, userId) {
  const { TIMEZONE_OFFSET: tzOffset } = constants.OFFICIAL;
  let responseText = '為您列出您期望的車票關注資訊:\n';
  const userWishTickets = await userWishTicket.getUserWishTicketsByUserId(
    pgPool,
    userId,
  );
  if (Array.isArray(userWishTickets.rows) && userWishTickets.rows.length > 0) {
    for (const t of userWishTickets.rows) {
      const timezoneDiff = tzOffset * 60 + t.departure_time.getTimezoneOffset();
      t.departure_time.setTime(
        t.departure_time.getTime() + timezoneDiff * 60 * 1000,
      );
      const [departureTimeYMD, departureTimeHMS] = t.departure_time
        .toISOString()
        .split('T');
      responseText = `${responseText}- ${t.station_pair} ${departureTimeYMD} ${
        departureTimeHMS.split(':00.')[0]
      } ${t.count}張\n`;
    }
  } else {
    responseText = '目前無關注資料';
  }

  return [
    {
      type: 'text',
      text: responseText,
    },
  ];
}

export default {
  getAllInstruction,
  getSearchActionInstruction,
  getFollowActionInstruction,
  getFollowListActionInstruction,
};
