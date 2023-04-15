sap.ui.define([
	"exed/com/qotamanager/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"exed/com/qotamanager/model/formatter",
	"sap/ui/Device"
	
], function (BaseController, JSONModel, formatter, Device) {
	"use strict";
	var skup;
	var zuserid;
	var chave;
	var vbeln;
	
	return BaseController.extend("exed.com.qotamanager.controller.Remanejar", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf exed.com.qotamanager.view.Remanejar
		 */
		onInit: function () {
			this.getRouter().getRoute("Remanejar").attachPatternMatched(this._onObjectMatched, this);

		},

		_onObjectMatched: function (oEvent) {
			// MATCH DE TELA, CARREGANDO INFO DE CAMPOS DO SERVICO DE ORDEM DE VENDA
			var sObjectId = JSON.parse(atob(oEvent.getParameter("arguments").skup));
			skup = sObjectId;
			chave = oEvent.getParameter("arguments").zchave;
			zuserid = oEvent.getParameter("arguments").zuserid;

			this.getView().byId("idTitleDependentes2").setText("Relocation" + " - " + "(" + zuserid + ")");

			vbeln = oEvent.getParameter("arguments").vbeln;
			this.bindatela(vbeln, sObjectId, chave);

		},

		bindatela: function (iVbeln, isObjectId, ichave) {
			this.getModel().metadataLoaded().then(function () {
				var sObjectPath = this.getModel().createKey("new_cotaovSet", {
					Vbeln: iVbeln,
					ZzbrAtpskp: isObjectId,
					Zuserid: zuserid,
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

		_onBindingChange: function (iSkup) {
			// FILTRO PARA SERVICO DE MARTERIAS, CARREGANDO INFO PARA TABELA.
			this.executaFiltro(iSkup);
		},

		executaFiltro: function (iSkup) {
			var valor = iSkup;
			var zsaldozero = "X";
			var kunnr = this.getView().byId("textKunnr_r").getText();
			var filter = new sap.ui.model.Filter("ZzbrAtpskp", sap.ui.model.FilterOperator.EQ, valor);
			var filter1 = new sap.ui.model.Filter("Kunnr", sap.ui.model.FilterOperator.EQ, kunnr);
			var filter2 = new sap.ui.model.Filter("Zsaldozero", sap.ui.model.FilterOperator.EQ, zsaldozero);
			var filter3 = new sap.ui.model.Filter("Zuserid", sap.ui.model.FilterOperator.EQ, zuserid);
			var list = this.getView().byId("list");
			list.getBinding("items").filter([filter, filter1, filter2, filter3]);

			/*         Limpar campo de Input    */
			var length = list.getItems().length;
			for (var i = 0; i <= length; i++) {
				var field = list.getItems()[i].getCells()[3].sId;
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
				skup: btoa(JSON.stringify(skup)),
				zuserid: zuserid,
				zchave: chave
			}, bReplace);
		},

		validaConteudo: function () {
			var tabela = this.getView().byId("list");
			var length = tabela.getItems().length;
			var nome;
			var valor;
			var valida;

			for (var i = 0; i < length; i++) {
				nome = tabela.getItems()[i].getCells()[0].getProperty("title");
				valor = tabela.getItems()[i].getCells()[3].getProperty("value");

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

		/**     onLiveChange    */
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

		onPressResumocarteira: function (oEvent) {
			var tabela = this.getView().byId("list");
			var length = tabela.getItems().length;
			var nome;
			var valor;
			var arrayVolume = this.buscarArrayVolume();
			var lengthArray = arrayVolume.length;
			var nomeArray;
			var valida;
			var sai = 0;
			var messagem = " Quantity field is empty !";
			var messagemError = "Invalid Input";
			var validaconteudo = this.validaConteudo();
			var saldo;
			var arraySaldo;
			var vError;

			arrayVolume.pop();
			lengthArray = 0;

			if (validaconteudo == 0) {
				sap.m.MessageBox.error(messagem, {
					actions: [sap.m.MessageBox.Action.CLOSE],
					onClose: function (sAction) {}

				});
				return;
			}

			if (length == 0) {
				sap.m.MessageBox.error("There are no customers to reassign", {
					actions: [sap.m.MessageBox.Action.CLOSE],
					onClose: function (sAction) {}
				});
				return;
			}

			for (var i = 0; i < length; i++) {
				nome = tabela.getItems()[i].getCells()[0].getProperty("title");
				valor = tabela.getItems()[i].getCells()[3].getProperty("value");
				vError = tabela.getItems()[i].getCells()[3].getProperty("valueState");
				saldo = tabela.getItems()[i].getCells()[2].getProperty("text");
				/*arraySaldo = saldo.split(":");
				saldo = arraySaldo[1];
				saldo = saldo.trim();*/
				saldo = parseFloat(saldo, 2);

				if (vError == "Error") {
					sap.m.MessageBox.error(messagemError, {
						actions: [sap.m.MessageBox.Action.CLOSE],
						onClose: function (sAction) {}

					});
					return;
				}

				/**         Tratar campo com valor zero  */

				valor = parseFloat(valor).toFixed(3);

				if (valor === "0" || valor === "0.00" || valor === "0.000" || valor === "0.0" || valor === "0." || valor === ".0" || valor ===
					"-0" || valor < 0) {
					sap.m.MessageBox.error("Enter a value greater than zero !", {
						actions: [sap.m.MessageBox.Action.CLOSE],
						onClose: function (sAction) {}
					});

					tabela.getItems()[i].getCells()[3].setProperty("valueState", "Error");

					return;
				} else {
					tabela.getItems()[i].getCells()[3].setProperty("valueState", "None");
				}

				/**             Tratar o valor digitado não pode ser maior que o Saldo livre*/
				if (valor > saldo) {
					sap.m.MessageBox.error("Balance less than the transferred amount.", {
						actions: [sap.m.MessageBox.Action.CLOSE],
						onClose: function (sAction) {}
					});

					tabela.getItems()[i].getCells()[3].setProperty("valueState", "Error");

					return;
				} else {
					tabela.getItems()[i].getCells()[3].setProperty("valueState", "None");
				}

				if (lengthArray !== 0) {

					for (var j = 0; j < lengthArray; j++) {
						nomeArray = arrayVolume[j].nome;
						valida = this.validaNome(nomeArray, nome);
						if (valida === 1) {
							sai = "1";
						}
					}
					if (sai === 0) {
						arrayVolume.push({
							nome: nome,
							valor: valor
						});
					} else {
						for (var K = 0; K < lengthArray; K++) {
							nomeArray = arrayVolume[K].nome;
							if (nomeArray === nome) {
								arrayVolume[K].valor = valor;
							}
						}
					}
				} else {
					arrayVolume.push({
						nome: nome,
						valor: valor
					});
				}
			}

			this.igualaArrayVolume(arrayVolume);

			var skp = this.getView().byId("textskp_r").getText();
			var vbeln = this.getView().byId("textVbeln_r").getText();

			this.getRouter().navTo("ResumoCarteira", {
				skup: btoa(JSON.stringify(skp)),
				vbeln: vbeln,
				zuserid: zuserid,
				zchave: chave
			}, true);
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
				var filter2 = new sap.ui.model.Filter("ZzbrAtpskp", sap.ui.model.FilterOperator.EQ, skup);
				var filter = new sap.ui.model.Filter("Zsearch", sap.ui.model.FilterOperator.EQ, valor);
				var filter3 = new sap.ui.model.Filter("Zuserid", sap.ui.model.FilterOperator.EQ, zuserid);
				var filter4 = new sap.ui.model.Filter("Zoperacao", sap.ui.model.FilterOperator.EQ, "9");

				var list = this.getView().byId("list");
				list.getBinding("items").filter([filter, filter2, filter3, filter4]);
			} else {
				this.executaFiltro(skup);
			}
		}

	});

});