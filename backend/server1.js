// ctrl + s for applying changes to server when running with nodemon
const express = require('express')
const app = express()
app.use(express.json());
const cors = require('cors');
app.use(cors());
const medicine_data = require('./models/medicine.model.js');
const keys_and_id = require('./models/keys_and_id.model.js');
const mongoose = require('mongoose');
const crypto = require('crypto');

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
        console.error(error);
    }
});

app.get('/', (req, res)=> {
    res.send('Hello World from nodejs');
});

// ============================================
// KEY GENERATION FUNCTIONS
// ============================================

/**
 * Generate a unique keypair for a manufacturer using ECDSA (secp256k1)
 */
function createManufacturerKeyPair() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', { 
        namedCurve: 'secp256k1',
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    return { publicKey, privateKey };
}

/**
 * Encrypt private key with random salt and IV
 * Returns: "salt:iv:encrypted" format
 */
function encryptPrivateKey(privateKey, master_key) {
    // Generate random salt and IV
    const salt = crypto.randomBytes(16);
    const iv = crypto.randomBytes(16);
    
    // Derive key from master_key using random salt
    const derivedKey = crypto.scryptSync(master_key, salt, 32);
    
    // Create cipher and encrypt
    const cipher = crypto.createCipheriv('aes-256-cbc', derivedKey, iv);
    let encrypted = cipher.update(privateKey, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    // Store salt:iv:encrypted for decryption
    return salt.toString('base64') + ":" + iv.toString('base64') + ":" + encrypted;
}

/**
 * Decrypt private key using stored salt and IV
 * Expects format: "salt:iv:encrypted"
 */
function decryptPrivateKey(encryptedPrivateKey, master_key) {
    const [saltBase64, ivBase64, encrypted] = encryptedPrivateKey.split(':');
    
    const salt = Buffer.from(saltBase64, 'base64');
    const iv = Buffer.from(ivBase64, 'base64');
    const encryptedBuffer = Buffer.from(encrypted, 'base64');
    
    // Derive same key using stored salt
    const derivedKey = crypto.scryptSync(master_key, salt, 32);
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', derivedKey, iv);
    let decrypted = decipher.update(encryptedBuffer);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString('utf8');
}

// ============================================
// DATABASE HELPER FUNCTIONS
// ============================================

async function checkIfMfIdExists(mf_id) {
    try {
        const existingRecord = await keys_and_id.findOne({ mf_id: mf_id });
        return !!existingRecord;
    } catch (error) {
        console.error("Error checking mf_id:", error);
        throw error;
    }
}

async function checkIfprodIdExists(prodID){
    try {
        const existingRecord = await medicine_data.findOne({prod_id: prodID });
        return !!existingRecord;
    } catch (error) {
        console.error("Error checking prod_id:", error);
        throw error;
    }
}

async function getPublicKey(mf_id) {
    try {
        const existingRecord = await keys_and_id.findOne({ mf_id: mf_id });
        if (existingRecord) {
            return existingRecord.publicKey;
        } else {
            return false;
        }
    } catch (error) {
        console.error("Error fetching public key:", error);
        throw error;
    }
}

async function getEncryptedPrivateKey(mf_id) {
    try {
        const existingRecord = await keys_and_id.findOne({ mf_id: mf_id });
        if (existingRecord) {
            return existingRecord.encrypted_privatekey;
        } else {
            return false;
        }
    } catch (error) {
        console.error("Error fetching encrypted private key:", error);
        throw error;
    }
}

async function getMedicineData(prod_id) {
    try {
        const existingRecord = await medicine_data.findOne({ prod_id: prod_id });
        if (existingRecord) {
            return existingRecord.med_data;
        } else {
            return false;
        }
    } catch (error) {
        console.error("Error checking prod_id:", error);
        throw error;
    }
}

// ============================================
// SIGNATURE FUNCTIONS
// ============================================

function signData(privateKeyPEM, data) {
    const hash = crypto.createHash('sha256').update(data).digest();
    const signature = crypto.sign("sha256", hash, { 
        key: privateKeyPEM, 
        dsaEncoding: 'der' 
    });
    return signature.toString('base64');
}

function verifySignature(signature, publicKeyPEM, data) {
    const signatureBuffer = Buffer.from(signature, 'base64');
    const hash = crypto.createHash('sha256').update(data).digest();
    const isVerified = crypto.verify("sha256", hash, publicKeyPEM, signatureBuffer);
    return isVerified;
}

// ============================================
// ROUTES
// ============================================

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

/**
 * Optional: Manual manufacturer registration endpoint
 * (Kept for backwards compatibility if needed)
 */
app.post('/addKeyPair', async (req, res) => {
    try {
        const { mf_id } = req.body;
        
        // Check if manufacturer already exists
        if (await checkIfMfIdExists(mf_id)) {
            return res.status(400).json({ message: 'Manufacturer ID already exists' });
        }
        
        // Generate unique keypair for this manufacturer
        const { publicKey, privateKey } = createManufacturerKeyPair();
        
        // Encrypt private key with random salt
        const encrypted_privatekey = encryptPrivateKey(privateKey, master_key);
        
        // Create new document
        const newKeyPair = new keys_and_id({
            mf_id,
            publicKey,
            encrypted_privatekey
        });
        
        // Save document in the database
        const savedKeyPair = await newKeyPair.save();
        
        res.status(201).json({ 
            message: 'Manufacturer registered successfully with unique keypair', 
            mf_id: savedKeyPair.mf_id,
            publicKey: savedKeyPair.publicKey
        });

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

app.get('/generate_prod_id', async (req, res)=> {
    try {
        const prodidSize = 16;
        let uniqueprodID = "pid" + generateMFID(prodidSize);
        
        while (await checkIfprodIdExists(uniqueprodID)) {
            uniqueprodID = "pid" + generateMFID(prodidSize);
        }
        res.status(200).send(uniqueprodID);
    } catch (error) {
        res.status(500).json({message : error.message});    
    }
});

const QRCode = require('qrcode');
const zlib = require('zlib');

/**
 * Generate QR code for a product
 * NOW: Automatically generates unique keypair for new manufacturers
 * OR: Uses existing keypair for returning manufacturers
 */
app.post('/gen_qr', async (req, res) => {
    try {
        const mf_id = req.body.mf_id.toString();
        const prod_id = req.body.prod_id.toString();
        const med_data = JSON.stringify(req.body.medicine_data);
        
        let manufacturerPrivateKey;
        let manufacturerPublicKey;
        let savedKeyPair = null;
        
        // Check if manufacturer already has a keypair
        const existingEncryptedPrivKey = await getEncryptedPrivateKey(mf_id);
        
        if (existingEncryptedPrivKey) {
            // Manufacturer exists - use their existing keypair
            manufacturerPrivateKey = decryptPrivateKey(existingEncryptedPrivKey, master_key);
            manufacturerPublicKey = await getPublicKey(mf_id);
        } else {
            // New manufacturer - generate unique keypair
            const keyPair = createManufacturerKeyPair();
            manufacturerPublicKey = keyPair.publicKey;
            manufacturerPrivateKey = keyPair.privateKey;
            
            // Encrypt private key with random salt
            const encryptedPrivateKey = encryptPrivateKey(manufacturerPrivateKey, master_key);
            
            // Save manufacturer's keypair to database
            const newKeyPair = new keys_and_id({
                mf_id, 
                publicKey: manufacturerPublicKey, 
                encrypted_privatekey: encryptedPrivateKey
            });
            
            savedKeyPair = await newKeyPair.save();
        }
        
        // Sign data with manufacturer's private key
        const signature = signData(manufacturerPrivateKey, med_data);
        
        // Save medicine data with signature
        const newMedicineData = new medicine_data({
            prod_id, 
            med_data, 
            digital_signature: signature 
        });
        
        const savedMedicineData = await newMedicineData.save();
        
        // Generate QR code
        const qrData = {
            s: signature,
            m: mf_id,
            p: prod_id
        };
        
        const qrDataString = JSON.stringify(qrData);
        
        zlib.deflate(qrDataString, (err, compressedBuffer) => {
            if (err) {
                console.error("Compression error:", err);
                return res.status(500).json({ message: 'Compression failed', error: err.message });
            }
            
            const compressedDataBase64 = compressedBuffer.toString('base64');
            
            QRCode.toDataURL(compressedDataBase64, (err, qrCodeUrl) => {
                if (err) {
                    console.error("Failed to generate QR code:", err);
                    return res.status(500).json({ message: 'QR generation failed', error: err.message });
                }
                
                res.status(201).json({ 
                    message: 'Successfully added to database and QR generated', 
                    savedKeyPair,
                    savedMedicineData, 
                    qrCodeUrl 
                });
            });
        });   
    } catch (error) {
        res.status(500).json({ message: 'Failed to generate QR code', error: error.message });
    }
});

/**
 * Verify QR code authenticity
 * Verifies signature using manufacturer's public key
 */
app.post('/verify_qr', async (req, res) => {
    try {
        const datafromqr = req.body.qr_data;
        const compressedBuffer = Buffer.from(datafromqr, 'base64');
        
        // Decompress the data
        zlib.inflate(compressedBuffer, async (err, buffer) => {
            if (err) {
                console.error("Error decompressing data:", err);
                return res.status(400).json({ 
                    message: 'Invalid QR code format', 
                    isVerified: false 
                });
            }
            
            try {
                // Parse QR data
                const decompressedData = buffer.toString('utf8');
                const jsonData = JSON.parse(decompressedData);
                const { s: signature, m: mf_id, p: prod_id } = jsonData;
                
                // Fetch manufacturer's public key and product data
                const currentPublicKey = await getPublicKey(mf_id);
                const currentData = await getMedicineData(prod_id);
                const medicineRecord = await medicine_data.findOne({ prod_id });
                if (!medicineRecord) return res.status(404).json({ message: "Product not found" });

                medicineRecord.verification_count += 1;
                medicineRecord.last_verified_at = new Date();
                await medicineRecord.save();

                if (!currentPublicKey || !currentData) {
                    return res.status(400).json({ 
                        message: 'Product not genuine — missing data in database', 
                        isVerified: false 
                    });
                }
                
                // Verify signature using manufacturer's public key
                const isVerified = verifySignature(signature, currentPublicKey, currentData);
                
                if (isVerified) {
                    if (medicineRecord.verification_count > 1) {
                    return res.status(200).json({
                        message: "⚠️ Warning: This QR has been scanned multiple times. Possible duplicate.",
                        isVerified: true,
                        manufacturer_id: mf_id,
                        product_id: prod_id,
                        product_data: JSON.parse(currentData)
                    });
                    } else {
                    return res.status(200).json({
                        message: "✅ Product is genuine and first-time verified.",
                        isVerified: true,
                        manufacturer_id: mf_id,
                        product_id: prod_id,
                        product_data: JSON.parse(currentData)
                    });
                    }
                } else {
                    res.status(400).json({ 
                        message: 'Product not genuine — signature verification failed', 
                        isVerified 
                    });
                }
            } catch (parseError) {
                return res.status(400).json({ 
                    message: 'Invalid QR data format', 
                    isVerified: false,
                    error: parseError.message
                });
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Run server on port 3000
app.listen(3000, ()=>{
    console.log("server running on port 3000"); 
});