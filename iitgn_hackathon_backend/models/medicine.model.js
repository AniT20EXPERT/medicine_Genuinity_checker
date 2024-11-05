const mongoose = require('mongoose');

const MedicineDataSchema = mongoose.Schema(
  {
    prod_id: {
      type: String,
      required: true,
      unique: true
    },
    med_data: {
      type: String,
      required: true,
    },
    digital_signature: {
      type: String,
      required: true,
    },

  },
  {
      timestamps: true
  }
) 

const medicine_data = mongoose.model('Meds', MedicineDataSchema); 
module.exports = medicine_data;





// const MedicineDataSchema = mongoose.Schema(
//     {
//     username: {
//         type: String,
//         required: true,
//         unique: true
//       },
//      med_data: {
//         type: String,
//         required: true,
//       },
//       med_hash: {
//         type: String,
//         required: false,
//       },
//       med_qr: {
//         type: String,
//         required: false,
//       },
//     },
//     {
//         timestamps: true
//     }
// ) 