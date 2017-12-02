//dependencies
var Payload = {};
/*
isType = text, attr, attrtext, image, video, audio
isMsgUrl = [messages] or "url" default = 'null'
isAttr = {attribute} default = 'null'
*/

Payload.cf = function (isType, isMsgUrl, isAttr) {
	//console.log(isType, isMsgUrl, isAttr);

	switch(isType) {
		case 'text':
			return ({"messages": isMsgUrl});
			break;
		case 'attr':
			return ({"set_attributes": isAttr});
			break;
		case 'attrtext':
			return ({"set_attributes": isAttr, "messages": isMsgUrl})
			break;
		default:
			return cfload(isType, isMsgUrl, isAttr);
			break;
	}
}

//this is payload for quick replies
Payload.cfQreply = function (isType, isMsg, isArray, isAttr) {
	//console.log(isType, isArray);

	switch(isType) {
		case 'qreply':
			return ({
				"messages": [{
					"text": isMsg,
					"quick_replies": isArray
				}]
			});
			break;
		default:
			return ({
				"set_attributes": isAttr,
				"messages": [{
					"text": isMsg,
					"quick_replies": isArray
				}]
			});
			break;
	}
}

//this is payload for quick replies
Payload.cfGallery = function (isType, isArray) {
	//console.log(isType, isArray);

	switch(isType) {
		case 'square':
			return ({
				"messages": [{
					"attachment":{
						"type": "template",
						"payload": {
							"template_type": "generic",
							"image_aspect_ratio": "square",
							"elements": isArray
						}
					}
				}]
			});
			break;
		default:
			return ({
				"messages": [{
					"attachment":{
						"type": "template",
						"payload": {
							"template_type": "generic",
							"elements": isArray
						}
					}
				}]
			});
			break;
	}
}


//this should capture payloads for image, video and audio
//default attributes = set_image, set_video, set_audio
Payload.cfload = function (isType, isMsgUrl, isAttr) {
	return ({
		"messages": [{ "attachment": {
				"type": isType,
				"payload": { "url": isMsgUrl }
			}
		}]
	})
}


//return router
module.exports = Payload;
