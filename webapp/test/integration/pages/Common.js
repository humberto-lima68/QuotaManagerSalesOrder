sap.ui.define([
	"sap/ui/test/Opa5",
	"../../../localService/mockserver"
], function (Opa5, mockserver) {
	"use strict";

	return Opa5.extend("exed.com.qotamanager.test.integration.pages.Common", {


		getEntitySet: function (sEntitySet) {
			return mockserver.getMockServer().getEntitySetData(sEntitySet);
		}

	});

});
