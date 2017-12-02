//dependencies
var restful = require('node-restful');
var mongoose = restful.mongoose;

//Schema
var addressSchema = new mongoose.Schema({
	PED_CPL: String,
	BLDG_ADDR: String,
	BLDG_CITY: String,
	BLDG_ST: String,
	BLDG_ZIP5: Number,
	CBSA_NM: String,
	BCL_Count: Number,
	IW_RECOMM_CD: String
});

//return models
module.exports = restful.model('tbladdress', addressSchema);
