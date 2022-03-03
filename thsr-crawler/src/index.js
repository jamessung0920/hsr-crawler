var http = require('http') // 1 - 載入 Node.js 原生模組 http

var server = http.createServer(function (req, res) {
    console.log(1)
    console.log(2)
    res.end('hello world')
})

server.listen(3000) //3 - 進入此網站的監聽 port, 就是 localhost:xxxx 的 xxxx

console.log('Node.js web server at port 3000 is running..')
