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
      response.end(`
        <html maaa=a>
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
            </style>
          </head>
          <body>
            <div>
              <img id='myid' />
              <img id="myImg" />
            </div>
          </body>
        </html>
      `)
    })
}).listen(8088)