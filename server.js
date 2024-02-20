const {
    validateSig,
    decodeWebSocketEvents,
    encodeWebSocketEvents,
    WebSocketContext,
    WebSocketMessageFormat,
    Publisher,
} = require('@fanoutio/grip');

const Koa = require( 'koa' );
const Router = require( '@koa/router' );
const { bodyParser } = require("@koa/bodyparser");
const { ServeGrip } = require( '@fanoutio/serve-grip' );
const { JWT, JWK} = require('@panva/jose');

const PORT = 8080;
const CHANNEL_NAME = 'test';
const PUSHPIN_URL = "http://localhost:5561/";

const app = new Koa();
const router = new Router();
const serveGrip = new ServeGrip({
    grip: {
        control_uri: PUSHPIN_URL,
    },
});

// custom 401 handling
app.use(async (ctx, next) => {
  try {
    await next();
  console.log(6);
  } catch (err) {
    if (401 == err.status) {
      ctx.status = 401;
      ctx.set('WWW-Authenticate', 'Basic');
      ctx.body = 'cant haz that';
    } else {
      throw err;
    }
  }
});

// require auth
app.use(async (ctx, next) => {
  const req = ctx.request;
  console.log(req.url);
  console.log(req.headers);

  const token = req.headers['authorization'];
  if (!token) {
    ctx.throw(400, 'Invalid authorization header');
  }

  try {
    const decodedToken = JWT.decode(token, { complete: true });
    console.log('Decoded Header:', decodedToken.header);
    console.log('Decoded Payload:', decodedToken.payload); 
    const key = JWK.asKey(decodedToken.header.jwk)
    console.log('Decoded JWK:', key); 

    if (!key) {
      ctx.throw(401, 'Unable to decode JWK');
    }
    
    // Verify the token using the JWK

    //console.log('Address:', jwk2Address(key)); 
    JWT.verify(token, key)
  } catch (error) {
    //console.log('Error:', error);
    ctx.throw(403, error.message);
  }

  console.log('Token verified');
  await next();
  console.log(5);

});
// Use bodyParser middleware with the desired options (in this case, to parse the body as text)
app.use(bodyParser({
    enableTypes: ['text'], // Enable parsing text/plain content type
    textLimit: '1mb' // Set limit on the size of the text body
}));
  
app.use(async (ctx, next) => {
    // Create a promise to wait until request body is fully received
    await new Promise((resolve, reject) => {
      let data = '';
      ctx.req.on('data', chunk => {
        data += chunk;
      });
      ctx.req.on('end', () => {
        ctx.request.body = data; // Attach the entire request body to ctx.request.body
        resolve(); // Resolve the promise indicating request body has been fully received
      });
      ctx.req.on('error', err => {
        reject(err); // Reject the promise if there's an error receiving the request body
      });
    });

    // Call the next middleware before the request body is fully received
    await next();
    console.log(4);

});

app.use(async (ctx, next) => {
  await next();
  console.log(1);
});

app.use(async (ctx, next) => {
  await next();
  console.log(2);
});

app.use(async (ctx, next) => {
  await next();
  console.log(3);
});

// Websocket-over-HTTP is translated to HTTP POST
router.post('/connect', ctx => {

    const req = ctx.request;
    const url = req.url;
    console.log(req.url);
    console.log(req.headers);

    if (!req.headers['grip-sig']) {
       ctx.status = 401;
       ctx.body = 'Make socket request to /connect. \n';
       console.log(ctx.body);
       return;
    }

    if (req.headers['content-type'] !== 'application/websocket-events') {
       ctx.status = 402;
       ctx.body = 'Not a WebSocket-over-HTTP request.\n';
       return;
    }

    // Make sure we have a connection ID
    let cid = req.headers['connection-id'];
    if (cid == null) {
       ctx.status = 403;
       ctx.body = 'connection-id required. \n';
       return;
    }
    //const inEventsEncoded = await req.text();
    const inEventsEncoded = ctx.request.body;
    console.log(ctx.request.body)
    const inEvents = decodeWebSocketEvents(inEventsEncoded);
    const wsContext = new WebSocketContext(cid, {}, inEvents);
    if (wsContext.isOpening()) {
       // Open the WebSocket and subscribe it to a channel:
       wsContext.accept();
       wsContext.subscribe('test');

    } else if (wsContext.canRecv()) {
        const reqStr = wsContext.recv();
        console.log(reqStr);
        if (reqStr===null) {
            console.log("Closed");
            wsContext.close(208);
        } else {
            wsContext.send(reqStr);
        } 

    }
    console.log("Send out");
    
    // The above commands made to the wsContext are buffered in the wsContext as "outgoing events".
    // Obtain them and write them to the response.
    const outEvents = wsContext.getOutgoingEvents();
    const responseString = encodeWebSocketEvents(outEvents);
    // Set the headers required by the GRIP proxy:
    const headers = wsContext.toHeaders();
    console.log("headers composed");
    // Set headers from the headers object
    Object.keys(headers).forEach(key => {
        ctx.set(key, headers[key]);
    });
    console.log("headers setted");
    ctx.body = responseString;
    console.log("body setted");
    ctx.status = 200;
    console.log("status setted");
    //return new Response(responseString, {status: 200, headers,});
});

router.post('/api/broadcast', async ctx => {

    const publisher = serveGrip.getPublisher();
    await publisher.publishFormats(CHANNEL_NAME, new WebSocketMessageFormat(ctx.request.body));
    console.log(ctx.request.body);

    ctx.set('Content-Type', 'text/plain');
    ctx.body = 'Ok\n';

});

app.use(router.routes())
    .use(router.allowedMethods());

app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`));
