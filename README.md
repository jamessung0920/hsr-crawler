# 功能

### 查詢車票

- 來自 高鐵官網、晚鳥票、ptt thsr, klook
- 先讓 user 輸入幾號幾時幾分幾張票與起迄站之後，列出時間之後最接近且最便宜的票 (sql 排序先排時間在排價格)
- 來自晚鳥票、ptt thsr, klook 的就直接貼網址給 user 點
- 透過語音辨識 captcha 並將車票擷取

### 關注車票

- 先輸入想要幾號幾時幾分幾張票之後與起迄站的車票，如果有的話 bot 會主動推播通知
- 列出最時間最接近且最便宜的票 (sql 排序先排時間在排價格)
- 可以大約 1hr 檢查一次

### 使用說明

- 告訴 user 如果要查詢、關注車票等等，文字格式是什麼
- 可再多發一則 template 給 user 複製

### 待優化

- rawTickets should be array raw data
- docker db volume
- docker log 刪除
- logger
- redis using gcp like memorystore
- 在撈出 db 資料同時，redis 的資料被刪掉以致讀不到資料，要解決
- 排序可再加上依照乘車時間長短排序
- 可給天氣預報讓 user 參考要搭哪班比較好
- ~~用 [line flex message](https://developers.line.biz/en/docs/messaging-api/using-flex-messages/)~~
- webhook response status 不是 2xx 時會 redeliver，因此如果有像是 network error 相關的 error 可以回傳非 2xx，並等下一次打進來 ([reference](https://developers.line.biz/en/news/2022/03/07/pre-release-webhook-redelivery/))
- promise all catch 沒有 catch 到 error
