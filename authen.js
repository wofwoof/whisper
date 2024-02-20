const { JWT, JWK} = require('@panva/jose');
const { ethers } = require('ethers');
const { generateKeyPairSync } = require('crypto');
const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksiLCJqd2siOnsia3R5IjoiRUMiLCJjcnYiOiJzZWNwMjU2azEiLCJ4IjoiRTVNRDBOcHo1aVJ2QVN0WFQzM0t5WUxwTEJJSjM0d3dyLUhndzVyczFKTSIsInkiOiJaeTdwd1dLOWFVZzA2OEdRYUZxcnZyME1NVlJLcDBNOHpGaDEyM01ZelVBIn19.eyJzdWIiOiI4NDNlMDcwYS02MDQwLTQzOTUtYjQzMC0zOWU5YTkzMTg5YTEiLCJyZXNvdXJjZV9hY2Nlc3MiOnsia2Fma2EiOnsicm9sZXMiOlsia2Fma2EtdG9waWM6c3VwZXJhcHBfKjpvd25lciJdfX0sImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwiaXNzIjoiaHR0cDpcL1wva2V5Y2xvYWs6ODA4MFwvYXV0aFwvcmVhbG1zXC9kZW1vIiwidHlwIjoiQmVhcmVyIiwicHJlZmVycmVkX3VzZXJuYW1lIjoiYWxpY2UiLCJzaWQiOiJiOTQyZTMxNi05ZTZkLTRhMDctODAxMS1lYmZmNGE4NTVkNDIiLCJnaXRjb2lucyI6Ilt7XCJzY29wZXNcIjpbXCJBbHRlclwiLFwiUmVhZFwiLFwiRGVzY3JpYmVcIixcIkRlbGV0ZVwiLFwiV3JpdGVcIixcIkNyZWF0ZVwiLFwiQWx0ZXJDb25maWdzXCIsXCJEZXNjcmliZUNvbmZpZ3NcIl0sXCJyc2lkXCI6XCJmN2JkMjdkMC1lNjY5LTQ3ZGMtYWNjNC01NjhjNzQzMzI5NzZcIixcInJzbmFtZVwiOlwiVG9waWM6YV8qXCJ9LHtcInNjb3Blc1wiOltcIkRlc2NyaWJlXCIsXCJXcml0ZVwiXSxcInJzaWRcIjpcImE3Y2YzMTc4LTExMGEtNDE2NS05Yzg2LWZhOGNkZDhkNDQzOFwiLFwicnNuYW1lXCI6XCJUb3BpYzp4XypcIn0se1wic2NvcGVzXCI6W1wiUmVhZFwiLFwiRGVzY3JpYmVcIl0sXCJyc2lkXCI6XCIyZGM4ZTgxZS0xYjI1LTQ1MzctYjVjMS1iOGY3ODI2NzgzMzZcIixcInJzbmFtZVwiOlwiR3JvdXA6YV8qXCJ9LHtcInNjb3Blc1wiOltcIklkZW1wb3RlbnRXcml0ZVwiXSxcInJzaWRcIjpcImQ0MmI1YmMzLTZkNjgtNDc4OS05MWU1LTZmMzRmN2FjOWFiN1wiLFwicnNuYW1lXCI6XCJrYWZrYS1jbHVzdGVyOm15LWNsdXN0ZXIsQ2x1c3RlcjoqXCJ9XSIsImF1ZCI6ImthZmthIiwiYWNyIjoiMSIsImF6cCI6ImthZmthLXByb2R1Y2VyLWNsaWVudCIsInNjb3BlIjoicHJvZmlsZSBlbWFpbCIsImV4cCI6MTcwMjE3MDU4MCwic2Vzc2lvbl9zdGF0ZSI6ImI5NDJlMzE2LTllNmQtNGEwNy04MDExLWViZmY0YTg1NWQ0MiIsImlhdCI6MTY4MzY3Nzg3NSwianRpIjoiY2U3YjRmYzItNWNkMS00ZDE5LTkyNjUtM2MzOGRhNDI0NTU0IiwiZW1haWwiOiJhbGljZUBleGFtcGxlLmNvbSJ9.bJ9TsPyvEuQHp4s8nRT6llVjJHtKFtXTq8ZBtKl_saFpreGXUhzEN67Rk4n_BjPLXj12AbUafljV8TUuduptTQ';
const privateHexStr = '0x7f63026c049cb4734da1dda0861485864c6ef3350e548e280f4af670728bef5e'

// Your JSON Web Key (JWK) with secp256k1 algorithm

function authen(ctx) {
  
  const req = ctx.request;
  console.log(req.headers);

  const token = req.headers['Authorization'];
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
      ctx.throw(400, 'Unable to decode JWK');
    }
    
    // Verify the token using the JWK

    console.log('Address:', jwk2Address(key)); 
    JWT.verify(token, key)
  } catch (error) {
    ctx.throw(400, error.message);
  }

  console.log('Token verified');
}
function createRandomJWK() {

  // Generate a SECP256K1 key pair
  const { privateKey, publicKey } = generateKeyPairSync('ec', {
    namedCurve: 'secp256k1',
  });

  // Create a JWK representation of the private key
  const privateKeyJWK = JWK.asKey(privateKey);

  // Create a JWKECKey with the private key
  const jwkECKey = JWK.asKey({
    kty: 'EC',
    crv: 'secp256k1',
    d: privateKeyJWK.d, // Include the private key
    x: privateKeyJWK.x,
    y: privateKeyJWK.y,
  });

  console.log('JWKECKey:', jwkECKey);
  console.log('JWKECKey:', ethers.decodeBase64(jwkECKey.d));
  return jwkECKey;
}

function createJWKECKey(private) {
  // Generate a SECP256K1 key pair
  const d = ethers.encodeBase64(private);
  const signingKey = new ethers.SigningKey(private);
  // Remove the prefix '0x04' to get the actual public key
  const address = ethers.computeAddress(signingKey.publicKey);
  console.log('address:', address);
  const publicKeyWithoutPrefix = signingKey.publicKey.slice(4);
  //console.log('xy-coordinate:', publicKeyWithoutPrefix);

  // Extract the x and y coordinates
  const xCoordinate = '0x' + publicKeyWithoutPrefix.slice(0, 64);
  const yCoordinate = '0x' + publicKeyWithoutPrefix.slice(64);

  console.log('x-coordinate:', xCoordinate);
  console.log('y-coordinate:', yCoordinate);

  const x = ethers.encodeBase64(xCoordinate);
  const y = ethers.encodeBase64(yCoordinate);

  console.log('x-coordinate-base64:', x);
  console.log('y-coordinate-base64:', y);
  // Create a JWKECKey with the private key
  const jwkECKey = JWK.asKey({
    kty: 'EC',
    crv: 'secp256k1',
    d: d, // Include the private key
    x: x,
    y: y,
  });

  console.log("Address: ", jwk2Address(jwkECKey));
  console.log('JWKECKey:', ethers.decodeBase64(jwkECKey.d));
  return jwkECKey;
}

createJWKECKey(privateHexStr);
createRandomJWK();
authenbyToken(token);
authenbyToken(creatToken(createRandomJWK()));

function creatToken(jwk) {
  // Your payload
  const payload = {
    sub: 'gitcoins',
    name: 'John Doe',
    iat: Math.floor(Date.now() / 1000),
  };

  // Your JWK representation
  const jwkHeader = {
    kty: 'EC',
    crv: 'secp256k1',
    x: jwk.x, 
    y: jwk.y,
  };

  // JWT options
  const options = {
    algorithm: 'ES256K',
    header: {
      jwk: jwkHeader,
    },
  };
  // Sign the token
  try {
    const token = JWT.sign(payload, jwk, options)
    console.log('Token:', token);
    return token;
  } catch (error) {
    console.error(error.message); 
  }
}

function authenbyToken(token){
  try {
      console.log('Token:', token);
      const decodedToken = JWT.decode(token, { complete: true });
      console.log('Decoded Header:', decodedToken.header);
      console.log('Decoded Payload:', decodedToken.payload); 
      const key = JWK.asKey(decodedToken.header.jwk)
      console.log('Decoded JWK:', key); 

      if (!key) {
        throw new Error('Unable to decode JWK');
      }
      
      // Verify the token using the JWK

      console.log('Address:', jwk2Address(key)); 
      JWT.verify(token, key)
  } catch (error) {
    console.error('Token verification failed:', error.message);
  }

  console.log('Token verified');  
}


// Public Key (uncompressed)
// computeAddress("0x0476698beebe8ee5c74d8cc50ab84ac301ee8f10af6f28d0ffd6adf4d6d3b9b762d46ca56d3dad2ce13213a6f42278dabbb53259f2d92681ea6a0b98197a719be3");
// '0x0Ac1dF02185025F65202660F8167210A80dD5086'
function jwk2Address(jwk) {
    try {
        // Extract the x and y coordinates from the JWK instance
        const { x, y} = jwk;
        const unit8ArrayX = ethers.decodeBase64(x);
        const unit8ArrayY = ethers.decodeBase64(y);

        // Construct the public key in uncompressed format
        const publicKey = ethers.concat(['0x04', unit8ArrayX, unit8ArrayY])
        console.log('publicKey:', publicKey); 

        // Compute the Ethereum address from the publicKey
        const address = ethers.computeAddress(publicKey);

        return address;
    } catch (error) {
        console.error('Error converting JWK to Ethereum address:', error.message);
        return null;
    }
}