echo "Step 2: Generate server key and CSR with SNI"
openssl genrsa -out server.key 2048 
openssl req -new -key server.key -out server.csr \
    -subj "/C=US/ST=State/L=Location/O=Organization/CN=10.141.1.5" \
    -reqexts SAN \
    -config <(printf "\n[SAN]\nsubjectAltName=DNS:ubuntu,DNS:localhost,IP:10.141.1.5")


echo "Step 3: Remove passphrase from server key"
cp server.key server.key.org
openssl rsa -in server.key.org -out server.key

echo "Step 4: Sign the server's certificate with the CA"
openssl x509 -req -days 365 -in server.csr \
     -CA ca.crt -CAkey ca.key -CAcreateserial -out server.crt \
     -extfile server.config


echo "Step 5: To create a single file containing all certificates in the chain"
cat server.crt ca.crt > server_chain.crt
cat server.key ca.key > server_chain.key
