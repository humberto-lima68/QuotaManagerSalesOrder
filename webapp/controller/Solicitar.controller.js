sap.ui.define([
	"exed/com/qotamanager/controller/BaseController",
	"sap/ui/Device"
], function (BaseController, Device) {
	"use strict";

	var chave;
	var zuserid;
	var vbeln;
	var ZzbrAtpskp;

	return BaseController.extend("exed.com.qotamanager.controller.Solicitar", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf osc.view.Solicitar
		 */

		onInit: function () {
			this.getRouter().getRoute("Solicitar").attachPatternMatched(this._onObjectMatched, this);
		},

		_onObjectMatched: function (oEvent) {
			// MATCH DE TELA, CARREGANDO INFO DE CAMPOS DO SERVICO DE ORDEM DE VENDA
			var kunnr = oEvent.getParameter("arguments").kunnr;
			ZzbrAtpskp = JSON.parse(atob(oEvent.getParameter("arguments").ZzbrAtpskp));

			zuserid = oEvent.getParameter("arguments").zuserid;

			this.getView().byId("idTitleDependentes4").setText("Request Quota" + " - " + "(" + zuserid + ")");

			chave = oEvent.getParameter("arguments").Chave;
			//	this.bindatela(kunnr, ZzbrAtpskp);
			vbeln = oEvent.getParameter("arguments").vbeln;
			this.bindatela(vbeln, ZzbrAtpskp, chave);
		},

		bindatela: function (iVbeln, isObjectId, ichave) {
			this.getModel().metadataLoaded().then(function () {
				var sObjectPath = this.getModel().createKey("new_cotaovSet", {
					Vbeln: iVbeln,
					ZzbrAtpskp: isObjectId,
					Zchave: ichave
				});
				this._bindView("/" + sObjectPath, isObjectId);
			}.bind(this));
		},

		_bindView: function (sObjectPath, isObjectId) {
			// Set busy indicator during view binding
			var oViewModel = this.getModel();

			// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
			oViewModel.setProperty("/busy", false);

			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this, isObjectId),
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
			this.executaFiltro();
		},

		executaFiltro: function () {
			var valor = this.getView().byId("ObjectListItemSKP01").getTitle();
			var filter = new sap.ui.model.Filter("ZzbrAtpskp", sap.ui.model.FilterOperator.EQ, valor);
			var filter1 = new sap.ui.model.Filter("Zuserid", sap.ui.model.FilterOperator.EQ, zuserid);
			var list = this.getView().byId("mclist1");
			list.getBinding("items").filter([filter, filter1]);

			// Limpar campo input
			var length = list.getItems().length;
			for (var i = 0; i <= length; i++) {
				var field = list.getItems()[i].getCells()[2].sId;
				if (this.getView().byId(field)) {
					this.getView().byId(field).setValue("");
				}

			}

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
		},

		_statusStateMap: {
			"P": "Warning",
			"F": "Error",
			"S": "None"
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
			// this.getRouter().navTo("master");
			var bReplace = !Device.system.phone;
			this.getRouter().navTo("DetailOV", {
				vbeln: vbeln,
				skup: btoa(JSON.stringify(ZzbrAtpskp)),
				zuserid: zuserid,
				zchave: chave
			}, bReplace);
		},

		validaConteudo: function () {
			var tabela = this.getView().byId("mclist1");
			var length = tabela.getItems().length;
			var nome;
			var valor;
			var valida;

			for (var i = 0; i < length; i++) {
				nome = tabela.getItems()[i].getCells()[0].getProperty("title");
				valor = tabela.getItems()[i].getCells()[2].getProperty("value");

				valor = parseFloat(valor, 2);

				if (isNaN(valor) || valor == 0) {
					valida = 0;

				} else {
					valida = 1;
					return valida;
				}

			}

			return valida;

		},

		onLiveChange: function (oValue) {

			var newValue = oValue.mParameters.value;
			var id = oValue.mParameters.id;

			while (newValue.indexOf(",") !== -1) {
				newValue = newValue.replace(",", ".");
			}

			var num = isNaN(newValue);

			if (num === true) {
				this.byId(id).setValueState("Error");
			} else {
				this.byId(id).setValueState("None");
				this.byId(id).setValue(newValue);
			}
		},

		onPressResumoSolicitacao: function () {
			var mclist1 = this.getView().byId("mclist1");
			var length = mclist1.getItems().length;
			var arraySolicitar = this.buscarArraySolicitar();
			var lengthArray = arraySolicitar.length;
			var nome;
			var valor;
			var nomeArray;
			var valida;
			var sai;
			/*Inicio*/
			var messagem = " Quantity field is empty";
			var messagemError = "Invalid Input";
			var validaconteudo = this.validaConteudo();
			var saldo;
			//	var arraySaldo;
			var vError;

			arraySolicitar.pop();
			lengthArray = 0;

			if (validaconteudo == 0) {
				sap.m.MessageBox.error(messagem, {
					actions: [sap.m.MessageBox.Action.CLOSE],
					onClose: function (sAction) {}

				});
				return;
			}

			/*fim*/

			if (length == 0) {
				sap.m.MessageBox.error("There is no manager to request", {
					actions: [sap.m.MessageBox.Action.CLOSE],
					onClose: function (sAction) {}
				});
				return;
			}

			for (var i = 0; i < length; i++) {
				nome = mclist1.getItems()[i].getCells()[0].getProperty("title");
				valor = mclist1.getItems()[i].getCells()[2].getProperty("value");
				vError = mclist1.getItems()[i].getCells()[2].getProperty("valueState");

				if (vError == "Error") {
					sap.m.MessageBox.error(messagemError, {
						actions: [sap.m.MessageBox.Action.CLOSE],
						onClose: function (sAction) {}

					});
					return;
				}

				/*Inicio*/
				saldo = mclist1.getItems()[i].getCells()[1].getProperty("text");;
				/*arraySaldo = saldo.split(":");
				saldo = arraySaldo[1];
				saldo = saldo.trim();*/
				saldo = parseFloat(saldo, 2);

				valor = parseFloat(valor).toFixed(3);

				if (valor === "0" || valor === "0.00" || valor === "0.000" || valor === "0.0" || valor === "0." || valor === ".0" || valor ===
					"-0" || valor < 0) {
					sap.m.MessageBox.error("Enter a value greater than zero!", {
						actions: [sap.m.MessageBox.Action.CLOSE],
						onClose: function (sAction) {}
					});

					mclist1.getItems()[i].getCells()[2].setProperty("valueState", "Error");

					return;
				} else {
					mclist1.getItems()[i].getCells()[2].setProperty("valueState", "None");
				}

				if (valor > saldo) {
					sap.m.MessageBox.error("Balance less than the transferred amount.", {
						actions: [sap.m.MessageBox.Action.CLOSE],
						onClose: function (sAction) {}
					});

					mclist1.getItems()[i].getCells()[2].setProperty("valueState", "Error");

					return;
				} else {
					mclist1.getItems()[i].getCells()[2].setProperty("valueState", "None");
				}
				/*Fim*/

				if (lengthArray !== 0) {

					for (var j = 0; j < lengthArray; j++) {
						nomeArray = arraySolicitar[j].nome;
						valida = this.validaNome(nomeArray, nome);
						if (valida === 1) {
							sai = "1";
						}
						if (sai === 0) {
							lengthArray.push({
								nome: nome,
								valor: valor
							});
						} else {
							for (var K = 0; K < lengthArray; K++) {
								nomeArray = arraySolicitar[K].nome;
								if (nomeArray === nome) {
									arraySolicitar[K].valor = valor;
								}
							}
						}
					}

				} else {
					arraySolicitar.push({
						nome: nome,
						valor: valor
					});
				}
			}
			this.igualaArrayVolume(arraySolicitar);

			var textkunnr = this.getView().byId("textkunnr").getText();
			var zbrAtpskp = this.getView().byId("textskup").getText();
			var vbeln = this.getView().byId("textvbeln").getText();
			this.getRouter().navTo("ResumoSolicitar", {
				kunnr: textkunnr,
				Chave: chave,
				ZzbrAtpskp: btoa(JSON.stringify(zbrAtpskp)),
				vbeln: vbeln,
				zuserid: zuserid
			});
		},

		validaNome: function (inomeArray, inome) {
			if (inomeArray === inome) {
				return 1;
			} else {
				return 0;
			}
		},

		onSearch: function (oEvent) {
			var valor = oEvent.getParameter("query");

			if (valor) {
				/* var skup = this.getView().byId("ObjectListItemOrt01").getNumber();*/
				var skup = this.getView().byId("textskup").getText();
				var filter = new sap.ui.model.Filter("ZzbrAtpskp", sap.ui.model.FilterOperator.EQ, skup);
				var filter1 = new sap.ui.model.Filter("Kunn2Name", sap.ui.model.FilterOperator.EQ, valor);
				var filter2 = new sap.ui.model.Filter("Zuserid", sap.ui.model.FilterOperator.EQ, zuserid);

				var list = this.getView().byId("mclist1");
				list.getBinding("items").filter([filter, filter1, filter2]);
			} else {
				this.executaFiltro();
			}
		}

	});

});