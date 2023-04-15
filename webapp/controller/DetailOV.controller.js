sap.ui.define([
	"exed/com/qotamanager/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"exed/com/qotamanager/model/formatter",
	"sap/ui/Device"
	
], function (BaseController, JSONModel, formatter, Device) {
	"use strict";
	var zuserid;
	var skup;
	var chave;
	var kunnr;

	return BaseController.extend("exed.com.qotamanager.controller.DetailOV", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf exed.com.qotamanager.view.DetailOV
		 */
		onInit: function () {
				var oViewModel = new JSONModel({
				busy: false,
				delay: 0
			});

		this.getRouter().getRoute("DetailOV").attachPatternMatched(this._onObjectMatched, this);

			this.setModel(oViewModel, "DetailOV");

			this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));

		},

		 
			_onObjectMatched: function (oEvent) {
			var sObjectId = oEvent.getParameter("arguments").vbeln;
			//	var skup = oEvent.getParameter("arguments").skup;
			skup = JSON.parse(atob(oEvent.getParameter("arguments").skup));

			zuserid = oEvent.getParameter("arguments").zuserid;
			chave = oEvent.getParameter("arguments").zchave;
	    	this.getView().byId("idTitleDependentes1").setText("Sales Order" + " - " + "(" + zuserid + ")");

			this.getView().getModel().refresh();

			var sObjectPath = this.getModel().createKey("new_cotaovSet", {
				Vbeln: sObjectId,
				ZzbrAtpskp: skup,
				Zchave: chave
			});
			this._bindView("/" + sObjectPath);

			this.getModel().metadataLoaded().then(function () {

			}.bind(this));
		},

	_bindView: function (sObjectPath) {
			// Set busy indicator during view binding
			var oViewModel = this.getModel("DetailOV");
			//	var oViewModel = this.getView().getModel();

			// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
			oViewModel.setProperty("/busy", false);

			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function () {
						oViewModel.setProperty("/busy", true);
					},
					dataReceived: function () {
						oViewModel.setProperty("/busy", false);
					}
				}
			});
		},

		_onBindingChange: function () {

			var oView = this.getView(),
				oElementBinding = oView.getElementBinding();

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("detailObjectNotFound");
				// if object could not be found, the selection in the master list
				// does not make sense anymore.
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
				return;
			}

			var sPath = oElementBinding.getPath(),
				oResourceBundle = this.getResourceBundle(),
				oObject = oView.getModel().getObject(sPath),
				sObjectId = oObject.Kunnr,
				sObjectName = oObject.KunnrName,
				oViewModel = this.getModel("DetailOV");
			//oViewModel = this.getView().getModel();

			this.getOwnerComponent().oListSelector.selectAListItem(sPath);

			oViewModel.setProperty("/saveAsTileTitle", oResourceBundle.getText("shareSaveTileAppTitle", [sObjectName]));
			oViewModel.setProperty("/shareOnJamTitle", sObjectName);
			oViewModel.setProperty("/shareSendEmailSubject",
				oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
			oViewModel.setProperty("/shareSendEmailMessage",
				oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));

		},

		_onMetadataLoaded: function () {
			// Store original busy indicator delay for the detail view
			var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
				oViewModel = this.getModel("DetailOV");
			//	oViewModel = this.getView().getModel();

			// Make sure busy indicator is displayed immediately when
			// detail view is displayed for the first time
			oViewModel.setProperty("/delay", 0);

			// Binding the view will set it to not busy - so the view is always busy if it is not bound
			oViewModel.setProperty("/busy", true);
			// Restore original busy indicator delay for the detail view
			oViewModel.setProperty("/delay", iOriginalViewBusyDelay);

		},

	/**
		 * Set the full screen mode to false and navigate to master page
		 */
		onCloseDetailPress: function () {
			this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", false);
			// No item should be selected on master after detail page is closed
			this.getOwnerComponent().oListSelector.clearMasterListSelection();
			this.getRouter().navTo("master");
		},
	
		onPressRemanejar: function () {
			var skp = this.getView().byId("textskp").getText();
			var vbeln = this.getView().byId("textVbeln").getText();
            var bReplace = !Device.system.phone;
			this.getRouter().navTo("Remanejar", {
				skup: btoa(JSON.stringify(skp)),
				vbeln: vbeln,
				zuserid: zuserid,
				zchave: chave
			}, bReplace);
		},

		onPressSolicitar: function () {

			var kunnr = this.getView().byId("textKunnr").getText();
			chave = this.getView().byId("textChave").getText();
			var textskp = this.getView().byId("textskp").getText();
			var skp = btoa(JSON.stringify(textskp));
			var vbeln = this.getView().byId("textVbeln").getText();

			this.getRouter().navTo("Solicitar", {
				kunnr: kunnr,
				Chave: chave,
				ZzbrAtpskp: skp,
				vbeln: vbeln,
				zuserid: zuserid
			}, true);
		},

				/*Formato de texto para Status.*/
		formatterStatus: function (oValue) {
			if (oValue == "F") {
				return "Error";
			}
			if (oValue == "S") {
				return "Warning";
			}

			if (oValue == "P") {
				return "Success";
			}

			if (oValue == "Z") {
				return "Warning";
			}

		},

		_statusStateMap: {
			"P": "Success",
			"F": "Error",
			"S": "Warning",
			"Z": "Warning"
		},

		statusText: function (value) {
			var bundle = this.getModel("i18n").getResourceBundle();
			return bundle.getText("StatusText" + value, "?");
		},

		statusState: function (value) {
			var map = this._statusStateMap;
			return (value && map[value]) ? map[value] : "None";
		},

		onVoltar: function () {
			this.getRouter().navTo("master");
		}

	});

 

});