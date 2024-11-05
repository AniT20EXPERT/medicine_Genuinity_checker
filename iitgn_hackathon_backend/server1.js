// ctrl + s for applying changes to server when running with nodemon
const express = require('express')
const app = express()
app.use(express.json());

const medicine_data = require('./models/medicine.model.js');
const keys_and_id = require('./models/keys_and_id.model.js');
const mongoose = require('mongoose');


//connecting db
require('dotenv').config();

const dbUri = process.env.MONGODB_URL_WITH_PASS;
const master_key = process.env.MASTER_KEY;


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
    console.log("server running on port 3000"); 
});

app.get('/', (req, res)=> {
    res.send('Hello World from nodejs');
});


// generating mf_id
//once mfid is generated then save it on auth db along with the account details


async function checkIfMfIdExists(mf_id) {
    try {
        const existingRecord = await keys_and_id.findOne({ mf_id: mf_id });
        
        if (existingRecord) {
            return true; // mf_id exists
        } else {
            return false; // mf_id does not exist
        }
    } catch (error) {
        console.error("Error checking mf_id:", error);
        throw error;
    }
}

const generateMFID = require('./mfid_gen.js');
app.get('/generate_mf_id', async (req, res) => {
    try {
        const mfidSize = 16;
        let uniqueMFID = "mfid" + generateMFID(mfidSize);
        // Loop until we find a unique mf_id
        while (await checkIfMfIdExists(uniqueMFID)) {
            uniqueMFID = "mfid" + generateMFID(mfidSize);
        }
        res.status(200).send(uniqueMFID);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/addKeyPair', async (req, res) => {
    try {
        const { mf_id, publicKey, encrypted_privatekey } = req.body;

        // Create new document
        const newKeyPair = new keys_and_id({
            mf_id,
            publicKey,
            encrypted_privatekey
        });

        // Save document in the database
        const savedKeyPair = await newKeyPair.save();
        res.status(201).json({ message: 'Key pair added successfully', savedKeyPair });

    } catch (error) {
        res.status(500).json({ message: 'Failed to add key pair', error: error.message });
    }
});

app.post('/med', async (req, res) => {
    try {
        const {prod_id, med_data, digital_signature } = req.body;

        // Create new document
        const newKeyPair = new medicine_data({
            prod_id,
            med_data,
            digital_signature
        });

        // Save document in the database
        const savedKeyPair = await newKeyPair.save();
        res.status(201).json({ message: 'Key pair added successfully', savedKeyPair });

    } catch (error) {
        res.status(500).json({ message: 'Failed to add key pair', error: error.message });
    }
});

async function checkIfprodIdExists(prodID){
    try {
        const existingRecord = await medicine_data.findOne({prod_id: prodID });
        
        if (existingRecord) {
            return true; // mf_id exists
        } else {
            return false; // mf_id does not exist
        }
    } catch (error) {
        console.error("Error checking mf_id:", error);
        throw error;
    }
}


app.get('/generate_prod_id', async (req, res)=> {
    try {
        const prodidSize = 16;
        //get current mfid from the auth db with respect to the account
        const uniqueprodID =  "pid" + generateMFID(prodidSize);
        while (await checkIfprodIdExists(uniqueprodID)) {
            uniqueprodID =  "pid" + generateMFID(prodidSize);
        }
        res.status(200).send(uniqueprodID);
    } catch (error) {
        res.status(500).json({message : error.message});    
    }
})


//getting keypair
const {privateKey , publicKey} = require('./keypair.js');
const crypto = require('crypto');

function encryptPrivateKey(privateKey, master_key) {
    // Generate an initialization vector (IV)
    const iv = crypto.randomBytes(16);

    // Create a Cipher instance with AES-256-CBC
    const cipher = crypto.createCipheriv('aes-256-cbc', crypto.scryptSync(master_key, 'salt', 32), iv);
    
    let encrypted = cipher.update(privateKey, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    // Combine IV and encrypted key for storage
    return iv.toString('base64') + ":" + encrypted;
}
function decryptPrivateKey(encryptedPrivateKey, master_key) {
    const [iv, encrypted] = encryptedPrivateKey.split(':').map(part => Buffer.from(part, 'base64'));

    const decipher = crypto.createDecipheriv('aes-256-cbc', crypto.scryptSync(master_key, 'salt', 32), iv);

    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

const QRCode = require('qrcode');
const zlib = require('zlib');  
const { get } = require('http');
app.post('/gen_qr', async (req, res) => {
    try {
        const mf_id = req.body.mf_id.toString(); //<=====
        const prod_id = req.body.prod_id.toString();//<=====
        const med_data = JSON.stringify(req.body.medicine_data);//<=====
        // console.log(mf_id);
        // console.log(prod_id);
        // console.log(medicine_data);

        // Hash the data (ECDSA typically signs the hash of data, not the data itself)
        const hash = crypto.createHash('sha256').update(med_data).digest();

        // Sign the hashed data
        const signature_non_string = crypto.sign("sha256", hash, { key: privateKey, dsaEncoding: 'der' });
        const signature = signature_non_string.toString('base64');

        // const hash = crypto.createHash('sha256').update(med_data).digest();
        // const signer = crypto.createSign('RSA-SHA256');
        // signer.update(hash);
        // const signature = signer.sign(privateKey, 'base64');


        const encryptedPrivateKey = encryptPrivateKey(privateKey, master_key);//<=====
       
        // console.log("Public Key:", publicKey);
        // console.log("Encrypted Private Key:", encryptedPrivateKey);
        // console.log(typeof(encryptedPrivateKey));
        // const decryptedPrivateKey = decryptPrivateKey(encryptedPrivateKey, master_key);
        // console.log("Decrypted Private Key:", decryptedPrivateKey);

        //Create new document
        const newKeyPair = new keys_and_id({
            mf_id, 
            publicKey, 
            encrypted_privatekey : encryptedPrivateKey
        });
        const newMedicineData = new medicine_data({
            prod_id, 
            med_data, 
            digital_signature : signature 
        });

        // Save document in the database
        const savedKeyPair = await newKeyPair.save();
        const savedMedicineData = await newMedicineData.save();
        //generate qr code
        const qrData = {
            s: signature,
            m: mf_id,
            p: prod_id
        };
        const qrDataString = JSON.stringify(qrData);
        zlib.deflate(qrDataString, (err, compressedBuffer) => {
            if (err) {
                console.error("Compression error:", err);
                return;
            }
            
            // Convert compressed data to base64
            const compressedDataBase64 = compressedBuffer.toString('base64');
        QRCode.toDataURL(compressedDataBase64, (err, qrCodeUrl) => {
            if (err) {
                console.error("Failed to generate QR code:", err);
                return;
            }
            res.status(201).json({ message: 'successfully added to database and qr generated ', savedKeyPair, savedMedicineData, qrCodeUrl });
        });
    });   
    } catch (error) {
        res.status(500).json({ message: 'Failed to generate QR code', error: error.message });
    }
});



async function getPublicKey(mf_id) {
    try {
        const existingRecord = await keys_and_id.findOne({ mf_id: mf_id });
        if (existingRecord) {
            return existingRecord.publicKey; // Return the public key if found
        } else {
            return false; // Return false if no record found
        }
    } catch (error) {
        console.error("Error checking mf_id:", error);
        throw error; // Rethrow error if any issues occur
    }
}

async function getMedicineData(prod_id) {
    try {
        const existingRecord = await medicine_data.findOne({ prod_id: prod_id });
        if (existingRecord) {
            return existingRecord.med_data; // Return the medicine data if found
        } else {
            return false; // Return false if no record found
        }
    } catch (error) {
        console.error("Error checking prod_id:", error);
        throw error; // Rethrow error if any issues occur
    }
}
function verifySignature(signature, publicKey, data) {
    // Convert the signature from string to Buffer (if necessary)
    const signatureBuffer = Buffer.from(signature, 'base64'); // Assuming the signature is base64 encoded

    // Create a hash of the original data
    const hash = crypto.createHash('sha256').update(data).digest();

    // Verify the signature using the public key
    const isVerified = crypto.verify("sha256", hash, publicKey, signatureBuffer);

    return isVerified;
}


app.post('/verify_qr', async (req, res) => {
    try {
        //post data from qr scan to this end point to datafromqr
        // const datafromqr = req.body.toString();
        datafromqr = "eJxNyMlygjAAANB/ybWdkYQtONMDGFAISwOlVm7QiIYaZbOAnf57r33H9wMGsAYz9rq6r7GnGePVXw3ZiD0x88ysziS8SoHO8tGNzbCiTbEfBqMpN6V1jWvXL3hioLafP4INZZnxqRW2VphPd8I1XUYjzqGgN12aeUuEeHgLK3kEm0KZjCX2YTfTNLqxSbXzavkmXGVCk6oSfJX9Ud9A26MSnfAxpa5R23JLFhw6eERqMujTpeBsXu0+a6l0GVc9PaCxWMbOk/aio97xzaAaBYH3fXhy08azq4t7OMyrONi5j+Adn5xBwOQsKWsYtARvUX5ToDiG01f/hkIa7bLLlu3005RagbI1o0X5JoHzOtxlpcTvZcMHWDhTfrn7W6RZhJCoLXv7Y38okyOSpcVeXsAzkGANZC04RKqmGya2FPAMWrAGr2lC/uXvH/q8fUI=";//temp for testing

        const compressedBuffer = Buffer.from(datafromqr, 'base64');

        // Decompress the data
        zlib.inflate(compressedBuffer, async (err, buffer) => {
        if (err) {
            console.error("Error decompressing data:", err);
            return res.status(400).json({ message: 'product is not genuine', isVerified: false });
        } else {
            // Convert buffer back to string and parse JSON
            const decompressedData = buffer.toString('utf8');
            const jsonData = JSON.parse(decompressedData);
            const {s, m, p} = jsonData;
            const signature = s;
            const mf_id = m;
            const prod_id = p;
           let currentPublicKey = await getPublicKey(mf_id);
           let currentData = await getMedicineData(prod_id);
           if(currentPublicKey == false || currentData == false){
            res.status(500).json({ message: 'product not genuine'});
           }
           //console.log(currentPublicKey, currentData, signature);
           //verify digital signature
           const isVerified = verifySignature(signature, currentPublicKey, currentData);
           if (isVerified) {
            res.status(200).json({ message: 'product is genuine', isVerified: isVerified});
           } else {
            res.status(500).json({ message: 'product not genuine', isVerified: isVerified});
           }

            // res.status(200).json({ message: 'qr data was read'});
        }
        });



    } catch (error) {
        res.status(500).json({message : error.message});
    }
});
