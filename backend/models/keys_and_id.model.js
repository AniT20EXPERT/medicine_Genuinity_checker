const mongoose = require('mongoose');
const { publicKey } = require('../keypair');

const KeysAndIdSchema = mongoose.Schema(
  {
    mf_id: {
      type: String,
      required: true,
      unique: true
    },
    publicKey: {
      type: String,
      required: true,
    },
    encrypted_privatekey: {
      type: String,
      required: true,
    },

  },
  {
      timestamps: true
  }
) 

const keys_and_id = mongoose.model('keys_and_id', KeysAndIdSchema); 
module.exports = keys_and_id;

