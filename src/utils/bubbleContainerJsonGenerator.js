/**
 *
 * @param {Object} ticketObj
 * @param {string} ticketObj.stationPair ex: 左營-台北
 * @param {string} ticketObj.date ex: 2022-04-11 (一)
 * @param {string} ticketObj.time  ex: 06:00 - 07:59
 * @param {string} ticketObj.stock ex: 10
 * @param {string} ticketObj.price ex: 965
 * @param {string} ticketObj.discount ex: 65折
 * @param {string} ticketObj.detailUrl ex: https://www.xyzabc123.co/
 * @param {boolean} isBookStep
 * @returns
 */
export default function generateLineBubbleContainerJson(ticketObj, isBookStep) {
  // reference: https://developers.line.biz/flex-simulator/
  let websiteContent;
  if (isBookStep) {
    websiteContent = {
      type: 'button',
      style: 'link',
      height: 'sm',
      action: {
        type: 'uri',
        label: 'WEBSITE',
        uri: ticketObj.detailUrl,
      },
    };
  }
  return {
    type: 'bubble',
    hero: {
      type: 'image',
      url: 'https://storage.googleapis.com/hero-image/blue.png',
      size: 'full',
      aspectRatio: '20:13',
      aspectMode: 'cover',
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: '晚鳥票',
          weight: 'bold',
          size: 'xl',
        },
        {
          type: 'box',
          layout: 'vertical',
          margin: 'lg',
          spacing: 'sm',
          contents: [
            {
              type: 'box',
              layout: 'baseline',
              spacing: 'sm',
              contents: [
                {
                  type: 'text',
                  text: '起訖站',
                  color: '#aaaaaa',
                  size: 'sm',
                  flex: 1,
                },
                {
                  type: 'text',
                  text: ticketObj.stationPair,
                  wrap: true,
                  color: '#666666',
                  size: 'sm',
                  flex: 5,
                },
              ],
            },
            {
              type: 'box',
              layout: 'baseline',
              spacing: 'sm',
              contents: [
                {
                  type: 'text',
                  text: '日期',
                  color: '#aaaaaa',
                  size: 'sm',
                  flex: 1,
                },
                {
                  type: 'text',
                  text: ticketObj.date,
                  wrap: true,
                  color: '#666666',
                  size: 'sm',
                  flex: 5,
                },
              ],
            },
            {
              type: 'box',
              layout: 'baseline',
              spacing: 'sm',
              contents: [
                {
                  type: 'text',
                  text: '時間',
                  color: '#aaaaaa',
                  size: 'sm',
                  flex: 1,
                },
                {
                  type: 'text',
                  text: ticketObj.time,
                  wrap: true,
                  color: '#666666',
                  size: 'sm',
                  flex: 5,
                },
              ],
            },
            {
              type: 'box',
              layout: 'baseline',
              spacing: 'sm',
              contents: [
                {
                  type: 'text',
                  text: '庫存',
                  color: '#aaaaaa',
                  size: 'sm',
                  flex: 1,
                },
                {
                  type: 'text',
                  text: ticketObj.stock,
                  wrap: true,
                  color: '#666666',
                  size: 'sm',
                  flex: 5,
                },
              ],
            },
            {
              type: 'box',
              layout: 'baseline',
              spacing: 'sm',
              contents: [
                {
                  type: 'text',
                  text: '價格',
                  color: '#aaaaaa',
                  size: 'sm',
                  flex: 1,
                },
                {
                  type: 'text',
                  text: ticketObj.price,
                  wrap: true,
                  color: '#666666',
                  size: 'sm',
                  flex: 5,
                },
              ],
            },
            {
              type: 'box',
              layout: 'baseline',
              spacing: 'sm',
              contents: [
                {
                  type: 'text',
                  text: '折扣',
                  color: '#aaaaaa',
                  size: 'sm',
                  flex: 1,
                },
                {
                  type: 'text',
                  text: ticketObj.discount,
                  wrap: true,
                  color: '#666666',
                  size: 'sm',
                  flex: 5,
                },
              ],
            },
          ],
        },
      ],
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      contents: [
        websiteContent,
        {
          type: 'box',
          layout: 'vertical',
          contents: [],
          margin: 'sm',
        },
      ].filter(Boolean),
      flex: 0,
    },
  };
}
