//dependencies
const express = require('express');
const mongoose = require('mongoose');
const request = require('request');
const bodyParser = require('body-parser');
// const urlDB = process.env.MONGOLAB_URI;

// const clientID = 'e6f23dd6-1f89-4e23-b182-725f972b20b6';
// const secretID = 'S4rI0bU7mO2lA1fC3pS5kS3iL2oD4iK3rJ3lI1bP1cU8sM5qV4';
const bankHost = 'https://api-uat.unionbankph.com/partners/sb';
let options = {
	method: 'GET',
	headers: {
		'accept': 'application/json',
		'x-ibm-client-id': 'e6f23dd6-1f89-4e23-b182-725f972b20b6',
		'x-ibm-client-secret': 'S4rI0bU7mO2lA1fC3pS5kS3iL2oD4iK3rJ3lI1bP1cU8sM5qV4'
	}
};


//connect to mongoDB
//mongoose.connect('mongodb://localhost:27017/rest-mlab', {useMongoClient: true});
// mongoose.Promise = global.Promise;
// mongoose.connect(urlDB, {useMongoClient: true}, function (err) {
//     if (err) console.error(err);
//     else console.log('mongo connected');
// });


//express
var app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

//routes
app.use('/api', require('./routes/api'));

//get payloads
var Payload = require('./routes/payload');

//get models
// var Address = require('./models/address');

//just a fancy checking of requests
app.get('/', function (req, res) {
	res.status(400).send('Use the /findAddress endpoint.')
})

///////////////////////////////////////////////////
// ENDPOINTS ARE HERE!!!
//////////////////////////////////////////////////


//https://ubankbot.herokuapp.com/
app.get('/ubank_atms', (req, res) => {
	let mysearch = req.query["user_location"];	
	options.url = bankHost+"/locators/v1/atms";

	request(options, (err, resp, body) => {
		if (err) { return console.log(err) }

	    // let json = JSON.parse(body);
		let out = JSON.parse(body);
	    let filter = new RegExp(mysearch, "i");
	    let count = 0;

	    console.log(mysearch);
	    console.log(filter);

		var qreplyList = [];

		for (var i = 0; i < out.length; i++) {
		    let mydata = out[i].address;

		    if (mydata.match(filter)) {
		    	if (i > 10) { break }
		    	console.log(out[i].latitude)
		    	console.log(out[i].longitude)

				var location = "location="+out[i].latitude+","+out[i].longitude;
				// location = location.replace(/ /g, "%20");
				// let location = "http://maps.googleapis.com/maps/api/streetview?size=640x300&location=42.345571,-71.098324";

				qreplyList.push({
					"title": out[i].name,
					"url": "https://ubankbot.herokuapp.com/qreply?"+location,
					"type": "json_plugin_url"
				});

		    	count++;
		    }
		    else {
		    	console.log("nooooo")
		    }
		}

		if (count === 0) {
			res.status(200).json(Payload.cf('text', [{"text": "Sorry, we don't have ATM on that place!"}], ''));
		}
		else {
			var msgQreply = "Please choose one from below.";
			res.status(200).json(Payload.cfQreply('qreply', msgQreply, qreplyList, ''));
		}

	})
})


//https://ubankbot.herokuapp.com/
app.get('/qreply', function (req, res) {
	let location = req.query.location;
	// location = location.replace(/ /g, "%20");
 	let imageUrl = "http://maps.googleapis.com/maps/api/streetview?size=640x300&location="+location;
 	console.log(location);
 	console.log(imageUrl);

	var gallery = [];
	gallery.push({
		"title": "Transact Now",
		"image_url": imageUrl,
		"subtitle": "Union Bank of the Philippines (UnionBank) is a publicly-listed universal bank.",
		"buttons":[
		  {
		    "type": "web_url",
		    "url": "https://www.unionbankph.com",
		    "title": "Avail Now"
		  }
		]
	});

    res.status(200).json(Payload.cfGallery('', gallery));
})


//https://ubankbot.herokuapp.com/
app.get('/redirect', function (req, res) {

	res.status(200).json(Payload.cf('text', [{"text": "ahhaha redirect!"}], ''));
})



//https://ubankbot.herokuapp.com/
app.post('/getToken', (req, res) => {
	if (!req.body["acc_scope"] || !req.body["acc_name"] || !req.body["acc_pass"]) {
		res.status(200).json(Payload.cf('text', [{"text": "error: Please complete all parameters!"}], ''));
	}

	let myScope = req.body["acc_scope"];
	let myName = req.body["acc_name"];
	let myPass = req.body["acc_pass"];
	
	var sendOptions = {
		url: 'https://api-uat.unionbankph.com/partners/sb/partners/v1/oauth2/token',
		body: 'grant_type=password&scope='+myScope+'&username='+myName+'&password='+myPass+'&client_id=e6f23dd6-1f89-4e23-b182-725f972b20b6',
		method: 'POST',
		headers: {
			'accept': 'application/json',
		    'content-type': 'application/x-www-form-urlencoded',
		}
	};

	request(sendOptions, (err, resp, body) => {
		if (err) { return console.log(err) }
		else {
		    // let json = JSON.parse(body);
			let out = JSON.parse(body);
			let token = out.access_token;
		    console.log(token);

		    sendMoney(req, res, token);
		}
	});
});



// Generic error handler used by all endpoints.
function sendMoney (req, res, token) {
	if (!req.body["user_mid"] || !req.body["user_date"] || !req.body["to_account"] || !req.body["to_value"]) {
		res.status(200).json(Payload.cf('text', [{"text": "error: Please complete all parameters!"}], ''));
	}

	let uMid = req.body["user_mid"];
	let uDate = req.body["user_date"];
	let toAcc = req.body["to_account"];
	let toVal = req.body["to_value"];

	let toCur = req.body["to_currency"]? req.body["to_currency"] : 'PHP';
	let toRem = req.body["to_remarks"]? req.body["to_remarks"] : '';
	let toPar = req.body["to_particulars"]? req.body["to_particulars"] : '';
	let toHol = req.body["to_accHolder"]? req.body["to_accHolder"] : '';
	let toMes = req.body["to_message"]? req.body["to_message"] : '';

	var sendOptions = {
		url: 'https://api-uat.unionbankph.com/partners/sb/partners/v1/transfers/single',
		method: 'POST',
		headers: {
			'accept': 'application/json',
			'content-type': 'application/json',
			'authorization': 'Bearer '+token,
			'x-ibm-client-id': 'e6f23dd6-1f89-4e23-b182-725f972b20b6',
			'x-ibm-client-secret': 'S4rI0bU7mO2lA1fC3pS5kS3iL2oD4iK3rJ3lI1bP1cU8sM5qV4',
			'x-partner-id': 'bd64c64c-25e2-4ae3-96a5-0f9d400ce4ae'
		},
		body: '{\r\n"senderTransferId": "'+uMid+'",\r\n"transferRequestDate": "'+uDate+'",\r\n"accountNo": "'+toAcc+'",\r\n"amount": {\r\n"currency": "'+toCur+'",\r\n"value": "'+toVal+'"\r\n},\r\n"remarks": "'+toRem+'",\r\n"particulars": "'+toPar+'",\r\n"info": [\r\n{\r\n"index": 1,\r\n"name": "Recipient",\r\n"value": "'+toHol+'"\r\n},\r\n{\r\n"index": 2,\r\n"name": "Message",\r\n"value": "'+toMes+'"\r\n}\r\n]\r\n}'
		// body: '{\r\n  "senderTransferId": "'+uMid+'",\r\n  "transferRequestDate": "'+uDate+'",\r\n  "accountNo": "'+toAcc+'",\r\n  "amount": {\r\n    "currency": "'+toCur+'",\r\n    "value": "100"\r\n  },\r\n  "remarks": "Transfer remarks",\r\n  "particulars": "Transfer particulars",\r\n  "info": [\r\n    {\r\n      "index": 1,\r\n      "name": "Recipient",\r\n      "value": "Juan Dela Cruz"\r\n    },\r\n    {\r\n      "index": 2,\r\n      "name": "Message",\r\n      "value": "Happy Birthday"\r\n    }\r\n  ]\r\n}\r\n'

	};

	request(sendOptions, (err, resp, body) => {
		if (err) { return console.log(err) }

	    // let json = JSON.parse(body);
		let out = JSON.parse(body);
	    console.log(out);

	    let transferId = out.transferId? out.transferId : 'failed'
	    let createdAt = out.createdAt? out.createdAt : 'failed'
	    let state = out.state? out.state : 'failed'
	    let senderTransferId = out.senderTransferId? out.senderTransferId : 'failed'

	    let mystatus = [];
	    mystatus.push(
	    	{"text": "transferId: "+transferId },
	    	{"text": "createdAt: "+createdAt },
	    	{"text": "state: "+state },
	    	{"text": "senderTransferId: "+senderTransferId }
	    );

		res.status(200).json(Payload.cf('text', mystatus, ''));
	});
}




















//POST request from bot
app.post('/findAddress', function(req, res) {
	var myReq = req.body;
	console.log(myReq);

	//FIND MATCHING ATTRIBUTE
	if (myReq.BLDG_ZIP5 && !myReq.BLDG_ADDR) {
		findAttrOne({"BLDG_ZIP5": myReq.BLDG_ZIP5}, myReq, res)
	}
	else if (myReq.BLDG_ZIP5 && myReq.BLDG_ADDR) {
		findAttrOne({"BLDG_ADDR": {$regex : '.*'+myReq.BLDG_ADDR+'.*', $options: 'i'}}, myReq, res)
	}
	else { handleError(res, "Error in attribute", "Invalid attribute.")}
});



//Find and get one attribute from input
function findAttrOne(toMatch, myReq, res) {
	Address.findOne( toMatch,
		function (err, addressFind) {
			//console.log(toMatch);
			//console.log(addressFind);
			//const msgErr = "Sorry, we don't have "+myReq.BLDG_ADDR+" address in our database.";

			//handle different conditions
			if (err) {
				res.status(200).json(Payload.cf('attr', '', {'BLDG_ZIP5': "-null-", 'BLDG_ADDR': "-null-"}));
			
			} //case when zipcode has no match
			else if (!addressFind) {
		        if (!myReq.BLDG_ADDR) {
		          res.status(200).json(Payload.cf('attr', '', {'BLDG_ZIP5': "-null-"}));
		        } //case when location has no match
		        else {
		          res.status(200).json(Payload.cf('attr', '', {'BLDG_ADDR': "-null-"}));
		        }

			} //address found here
			else if (myReq.BLDG_ADDR) {
				findAttrAll( { $and:[
					{"BLDG_ZIP5": myReq.BLDG_ZIP5},
					{"BLDG_ADDR": {$regex : '.*'+myReq.BLDG_ADDR+'.*', $options: 'i'}}
				]}, myReq, res
				);

			} 
			else {
				res.status(200).json(Payload.cf('attrtext', [{"text": "Found it!"}], {'BLDG_ZIP5': addressFind.BLDG_ZIP5}));
			}
		}
	);
}


//Find all attribute from input
function findAttrAll(toMatch, myReq, res) {
	Address.find( toMatch,
		function (err, addressFind) {
			//console.log(toMatch);
			//console.log(addressFind);
			//const msgErr = "Sorry, I'm afraid we don't have any "+myReq.BLDG_ZIP5+" zipcode in "+myReq.BLDG_ADDR;

			//handle different conditions
			if (err) {
				res.status(200).json(Payload.cf('attr', '', {'BLDG_ADDR': "-null-"}));
			
			} 
			else if (!addressFind || addressFind.length === 0) {
				res.status(200).json(Payload.cf('attr', '', {'BLDG_ADDR': "-null-"}));
			
			} 
			else {
				var qreplyList = [];

				for (var i = addressFind.length - 1; i >= 0; i--) {
					const addr = addressFind[i].BLDG_ADDR;
					const city = addressFind[i].BLDG_CITY;
					const state = addressFind[i].BLDG_ST;
					const zip = addressFind[i].BLDG_ZIP5;
					var location = "location="+addr+",%20"+city+",%20"+state+"%20"+zip;
					location = location.replace(/ /g, "%20");
					//console.log(location);

					qreplyList.push({
						"title": addressFind[i].BLDG_ADDR,
						"url": "https://viacore.herokuapp.com/qreply?"+location,
						"type": "json_plugin_url"
					});
				}
				console.log(qreplyList);
				
				var msgQreply = "Please choose one from below.";
				res.status(200).json(Payload.cfQreply('qreply', msgQreply, qreplyList, ''));
				//res.status(200).json(Payload.cf('text', [{"text": imageUrl}], ''));
			}
		}
	);
}


















// Generic error handler used by all endpoints.
function handleError(res, reason, message, code) {
	console.log("ERROR: " + reason);
	res.status(code || 500).json({"error": message});
}


// Initialize the app.
var server = app.listen(process.env.PORT || 8080, function () {
	var port = server.address().port;
	console.log("App now running on port", port);
});
