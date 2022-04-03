function getAllInstruction() {
  return [
    {
      type: 'text',
      text: '此bot可方便您查詢以及關注您需要的票，結果來自各大網站，這裡會一併統整給您。\n\n\n查詢車票\n會詢問您需要的票，請依照指定格式填入車票資訊\n\n\n關注車票\n可預先填入您想要的車票(可接受未來半年內)，若有相關車票符合您的期待時，將會傳送訊息通知您。\n\n⚠️注意⚠️: 此bot並不提供訂票搶票功能。',
    },
  ];
}

function getSearchStepInstruction() {
  return [
    {
      type: 'text',
      text: '請輸入您需要的車票。\n\n格式為: 起站-迄站 日期 時間 張數\nEX:\n  台北-台中 2022-03-29 09:00 1張',
    },
  ];
}

function getFollowStepInstruction() {
  return [
    {
      type: 'text',
      text: '請預先填入您想要的車票(可接受未來半年內)，會在未來有車票時通知您。\n\n格式為: 起站-迄站 日期 時間 張數\nEX:\n  台北-台中 2022-03-29 09:00 1張',
    },
  ];
}

export default {
  getAllInstruction,
  getSearchStepInstruction,
  getFollowStepInstruction,
};
