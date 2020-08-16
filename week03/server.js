const http = require('http')

http.createServer((request, response) => {
  let body = []
  request
    .on('error', (err) => {
      console.log(err)
    })
    .on('data', (chunk) => {
      body.push(Buffer.from(chunk))
    })
    .on('end', () => {
      body = Buffer.concat(body).toString()
      console.log('body:', body)
      response.writeHead(200, {'Content-Type': 'text/html'})
      response.end(`<html maaa=a>
<head>
  <style>
    body div #myid {
      width: 100px;
      background-color: '#ff5000';
    }
    body div img {
      width: 30px;
      background-color: '#ff1111';
    }
    body div .p-class-1 {
      background-color: '#000000';
    }
    body div .p-class-2 {
      color: '#ffffff';
    }
    p {
      text-align: 'left';
    }
    p.p-class-1.p-class-2 {
      text-align: 'center';
    }
    p.p-class-2 {
      text-align: 'right';
    }
  </style>
</head>
<body>
  <div>
    <img id='myid' />
    <img id="myImg" />
    <p class="p-class-1 p-class-2">p text</p>
  </div>
</body>
</html>`)
    })
}).listen(8088)