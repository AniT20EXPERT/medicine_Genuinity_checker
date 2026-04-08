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

function calcHash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}


app.get('/getmedicine', async (req, res)=> {
    try{
        const med_data = await medicine_data.find();
        res.status(200).json(med_data);
    }
    catch (error) {
        res.status(500).json({message : error.message});
    }
});

const QRCode = require('qrcode');


app.post('/addmedicine', async (req, res) => {
    try {
        // Declare `username` and `meddata` with `let`
        let username = req.body.username;
        let meddata = JSON.stringify(req.body.med_data); // Stringify med_data here

        // Check if medicine data by this user already exists
        const existingMedicine = await medicine_data.findOne({ username: username, med_data: meddata });
        
        if (existingMedicine) {
            return res.status(400).json({ message: 'Medicine added by this user already exists' });
        }

        // Calculate hash and prepare JSON
        const med_hash = calcHash(meddata);
        
        // Generate QR code
        QRCode.toDataURL(meddata, async (err, url) => {
            if (err) {
                console.error("Error generating QR code:", err);
                return res.status(500).json({ message: "Failed to generate QR code" });
            }
            const med_json = { username: username, med_data: meddata, med_hash: med_hash, med_qr: url }; // `med_data` as a string

            // Create and save new medicine data
            const med = await medicine_data.create(med_json);
            res.status(200).json({ med, qr_url: url });
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.put('/updatemedicine/:id', async (req, res) => {
    try {
        const id = req.params.id;
        let meddata = JSON.stringify(req.body.med_data);
        const med_hash = calcHash(meddata);

        // Create an object with the fields to update
        const updatedFields = {
            username: req.body.username,
            med_data: meddata,
            med_hash: med_hash
        };

        // Use `findByIdAndUpdate` with the updatedFields object
        const update_medicine = await medicine_data.findByIdAndUpdate(id, updatedFields, { new: true });

        if (!update_medicine) {
            return res.status(404).json({ message: "Medicine not found" });
        }
        QRCode.toDataURL(meddata, async (err, url) => {
            if (err) {
                console.error("Error generating QR code:", err);
                return res.status(500).json({ message: "Failed to generate QR code" });
            }
            
            res.status(200).json({ update_medicine, qr_url: url });
        });
        
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.delete('/deletemedicine/:id', async (req, res)=> {
    try{
        const id = req.params.id;
        const delete_medicine = await medicine_data.findByIdAndDelete(id);
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid ID format" });
        }
        if(!delete_medicine) {
            return res.status(404).json({message : "med not found"});
        }
        res.status(200).json({"med" : delete_medicine, "message" : "med deleted"});
    }
    catch (error) {
        res.status(500).json({message : error.message});
    }
})

//patient side


//say we get a post request from patient side on /validateqr with req.body.jsonfromqr

app.post('/validateqr', async (req, res)=> {
    try{
        
        const med_data = await medicine_data.find();
        res.status(200).json(med_data);
    }
    catch (error) {
        res.status(500).json({message : error.message});
    }
});








