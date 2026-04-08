const jsonData = {
    "manufacturer_username": "john_doe",
    "medicine_data": {
        "medicine_id": "MED67890",
        "batch_number": "BATCH2345",
        "expiry_date": "2025-06-30",
        "manufacturer_info": {
            "manufacturer_name": "XYZ Pharma Inc.",
            "manufacturer_id": "XYZ12345"
        },
        "serial_number": "SER09876",
        "composition": {
            "active_ingredients": [
                {
                    "name": "Ibuprofen",
                    "amount": "200mg"
                },
                {
                    "name": "Codeine",
                    "amount": "30mg"
                }
            ],
            "dosage": {
                "amount": "200mg",
                "frequency": "3 times per day"
            },
            "storage_instructions": "Keep below 30°C, away from direct sunlight",
            "side_effects": [
                "Drowsiness",
                "Nausea",
                "Headache"
            ]
        },
        "regulatory_info": {
            "approval_number": "FDA987654",
            "license_holder": "XYZ Pharma License #123456",
            "country_of_origin": "India"
        },
        "additional_info": {
            "manufacturing_date": "2023-02-15"
        }
    }
};

const jsonString = JSON.stringify(jsonData);
const byteLength = Buffer.byteLength(jsonString, 'utf8');
console.log(`Size of JSON data: ${byteLength} bytes`);
