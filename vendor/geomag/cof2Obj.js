/*
	cof2Obj.js
	Converts the WMM.COF text to a JSON object usable by geoMagFactory().
*/

function cof2Obj(cof) {
	'use strict';
	var modelLines = cof.split('\n'),
		wmm = [],
		i, vals, epoch, model, modelDate;
	for (i in modelLines) {
		if (modelLines.hasOwnProperty(i)) {
			vals = modelLines[i].replace(/^\s+|\s+$/g, "").split(/\s+/);
			if (vals.length === 3) {
				epoch = parseFloat(vals[0]);
				model = vals[1];
				modelDate = vals[2];
			} else if (vals.length === 6) {
				wmm.push({
					n: parseInt(vals[0], 10),
					m: parseInt(vals[1], 10),
					gnm: parseFloat(vals[2]),
					hnm: parseFloat(vals[3]),
					dgnm: parseFloat(vals[4]),
					dhnm: parseFloat(vals[5])
				});
			}
		}
	}

	return {epoch: epoch, model: model, modelDate: modelDate, wmm: wmm};
}
