# 功能

### 查詢車票

- 來自 高鐵官網、晚鳥票、ptt thsr, klook
- 輸入幾號幾時幾分幾張票與起迄站之後，顯示各網站的票

## 訂票

- 先讓 user 輸入幾號幾時幾分幾張票與起迄站之後，列出時間之後最接近且最便宜的票 (sql 排序先排時間在排價格)
- 來自晚鳥票、ptt thsr, klook 的就直接貼網址給 user 點
- 來自高鐵官網就試看看可不可以 bypass recaptcha 並訂票，另外網站訂的票可否在 app 擷取要研究

### 關注車票

- 先輸入想要幾號幾時幾分幾張票之後與起迄站的車票，如果有的話 bot 會主動推播通知
- 列出最時間最接近且最便宜的票 (sql 排序先排時間在排價格)
- 可以大約 1hr 檢查一次

### 使用說明

- 告訴 user 如果要訂票、關注車票等等，文字格式是什麼
- 可再多發一則 template 給 user 複製

### 待優化

- rawTickets should be array raw data
- docker db volume
- docker log 刪除
- logger
- redis using gcp like memorystore
