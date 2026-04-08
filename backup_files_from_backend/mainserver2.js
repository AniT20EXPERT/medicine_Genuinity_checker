// ctrl + s for applying changes to server when running with nodemon
const express = require('express')
const app = express()
app.use(express.json());

const medicine_data = require('./models/medicine.model.js');
const mongoose = require('mongoose');


//connecting db
require('dotenv').config();

const dbUri = process.env.MONGODB_URL_WITH_PASS;


mongoose.connect(dbUri)
.then(()=>{
    try{
        console.log("connected db succesfully");
    }
    catch (error) {
        // handle the error here
        console.error(error);
    }
});

//run server on port 3000

app.listen(3000, ()=>{
    console.log("server running on port 3000"); //only on console screen i.e terminal
});

app.get('/', (req, res)=> {
    res.send('Hello World from nodejs');
});


const crypto = require('crypto');

const {publicEncrypt, privateDecrypt} = require('crypto');
const {privateKey , publicKey} = require('./keypair.js');


function assymetricEncryption(symmetricKey){
    const encryptedKey = publicEncrypt(publicKey, Buffer.from(symmetricKey, 'hex'));
    return encryptedKey.toString('hex');
}

function generateSymmetricKey() {
    return crypto.randomBytes(32); // AES-256 key
}


function encryptWithSymmetricKey(data, symmetricKey) {
    const iv = crypto.randomBytes(16); // Initialization vector
    const cipher = crypto.createCipheriv('aes-256-cbc', symmetricKey, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return { iv: iv.toString('hex'), encryptedData: encrypted };
}



function encrypting_json_data(medicine_data){
    const symmetricKey = generateSymmetricKey();
    const encrypted = encryptWithSymmetricKey(JSON.stringify(medicine_data), symmetricKey);
return { encryptedData: encrypted.encryptedData, symmetricKey: symmetricKey.toString('hex') , iv: encrypted.iv};
}

function decrypting_symmetricKey(encrypted_symmetricKey){
    const symmetricKey = privateDecrypt(privateKey, Buffer.from(encrypted_symmetricKey, 'hex'));
    return symmetricKey.toString('hex');
}

function decryptingData(encryptedData, encrypted_symmetricKey, iv){
    symmetricKey = decrypting_symmetricKey(encrypted_symmetricKey);
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(symmetricKey, 'hex'), Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  }



const {createSign, createVerify} = require('crypto');

function create_digital_signature(encrypted_data){
    try {
        const signer = createSign('RSA-SHA256');
        signer.update(encrypted_data);
        const signature = signer.sign(privateKey, 'hex');
        return signature;
    } catch (error) {
        console.log(error);
    }
}

function verifying_digital_signature(encrypted_data, signature){
    try {
        const verifier = createVerify('RSA-SHA256');
        verifier.update(encrypted_data);
        const isVerified = verifier.verify(publicKey, signature, 'hex');
        return isVerified;
    } catch (error) {
        console.log(error);
    }
}

const QRCode = require('qrcode');
const zlib = require('zlib');


app.get('/manufacture_endpoint', (req, res)=> {
    try {
        
    } catch (error) {
        res.status(500).json({message : error.message});
    }
})



app.post('/manufacture_endpoint', async (req, res)=> {
    try{
        let medicine_data = req.body.medicine_data;
        let {encryptedData, symmetricKey, iv} = encrypting_json_data(medicine_data);
        let encrypted_symmetricKey = assymetricEncryption(symmetricKey)
        let manufacture_username = req.body.manufacturer_username;
        let digital_signature = create_digital_signature(encryptedData);
        
        
        let decryptedData = decryptingData(encryptedData, encrypted_symmetricKey, iv)
        let verify_digital_signature = verifying_digital_signature(encryptedData, digital_signature)


//         const jsonString = JSON.stringify({
//             "encrypted_med_data": encryptedData,
//             "manufacture username": manufacture_username,
//             "encrypted_symmetricKey": encrypted_symmetricKey,
//             "digital_signature": digital_signature,
//         });

// // Compress the JSON string
//         zlib.deflate(jsonString, (err, buffer) => {
//         if (!err) {
//              const compressedData = buffer.toString('base64'); // Use base64 encoding for compatibility with QR
//             QRCode.toDataURL(compressedData, (err, url) => {
//                  if (err) {
//                     console.error("Error generating QR code", err);
//                  } else {
//                      res.status(200).json({
//                          "url": url
//                      });
//                     }
//         });

//     } else {
//         console.error("Compression error:", err);
//     }
// });
        

        res.status(200).json({
            "encrypted_med_data": encryptedData,
            "data_encryption_key": symmetricKey,
            "manufacture username": manufacture_username,
            "encrypted_symmetricKey": encrypted_symmetricKey,
            "digital_signature": digital_signature,
            "decrypted_data": decryptedData,
            "isVerified": verify_digital_signature
        });
    }
    catch (error) {
        res.status(500).json({message : error.message});
    }
});







