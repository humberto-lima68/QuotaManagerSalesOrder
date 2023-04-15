
sap.ui.define([
	"exed/com/qotamanager/controller/BaseController", "sap/m/DialogType", "sap/ui/core/ValueState", "sap/m/Dialog", "sap/m/Button", "sap/m/ButtonType",
	"sap/m/Text", "sap/m/MessageToast"
], function (BaseController, DialogType, ValueState, Dialog, Button, ButtonType, Text, MessageToast) {
	"use strict";

	var chave;
	var kunnr;
	var ZzbrAtpskp;
	var globalVbeln;
	var globalSkup;
	var zuserid;
	var oBusyDialog = new sap.m.BusyDialog();
	
	return BaseController.extend("exed.com.qotamanager.controller.ResumoSolicitar", {

		onInit: function () {
			this.getRouter().getRoute("ResumoSolicitar").attachPatternMatched(this._onObjectMatched, this);
		},

		_onObjectMatched: function (oEvent) {
			// MATCH DE TELA, CARREGANDO INFO DE CAMPOS DO SERVICO DE ORDEM DE VENDA
			kunnr = oEvent.getParameter("arguments").kunnr;
			chave = oEvent.getParameter("arguments").Chave;
			zuserid = oEvent.getParameter("arguments").zuserid;
			var vbeln = oEvent.getParameter("arguments").vbeln;
			//var ZzbrAtpskp = oEvent.getParameter("arguments").ZzbrAtpskp;
			var ZzbrAtpskp = JSON.parse(atob(oEvent.getParameter("arguments").ZzbrAtpskp));
			
			globalVbeln = vbeln;
			globalSkup = ZzbrAtpskp;
			this.bindatela(vbeln, ZzbrAtpskp, chave);
		},

		bindatela: function (iVbeln, iSkup, ichave) {
			this.getModel().metadataLoaded().then(function () {
				var sObjectPath = this.getModel().createKey("new_cotaovSet", {
					Vbeln: iVbeln,
					ZzbrAtpskp: iSkup,
					Zchave: ichave
				});
				this._bindView("/" + sObjectPath, iSkup);
			}.bind(this));

		},

		_bindView: function (sObjectPath) {
			// Set busy indicator during view binding
			var oViewModel = this.getModel();
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
			var ZzbrAtpskp = this.getView().byId("textskup").getText();
			this.executaFiltro(ZzbrAtpskp);
		},
		executaFiltro: function (iZzbrAtpskp) {
			var valor = iZzbrAtpskp;
			var filter = new sap.ui.model.Filter("ZzbrAtpskp", sap.ui.model.FilterOperator.EQ, valor);
			var filter1 = new sap.ui.model.Filter("Zuserid", sap.ui.model.FilterOperator.EQ, zuserid);
			var list = this.getView().byId("listResumo");
			list.getBinding("items").filter([filter, filter1]);
		},

		onModelContextChange: function () {
			this.buscaInfoSolicitar();
			this.calculaTotal();
		},

		buscaInfoSolicitar: function () {
			var tabelaResumo = this.getView().byId("listResumo");
			var length = tabelaResumo.getItems().length;
			var nomeResumo;
			var valorResumo;
			var nomeTabelaResumo;
			var idVolume;
			var arrayVolume = this.buscarArraySolicitar();
			var lengthArray = arrayVolume.length;

			for (var i = 0; i < lengthArray; i++) {
				nomeResumo = "";
				valorResumo = "";
				nomeResumo = arrayVolume[i].nome;
				valorResumo = arrayVolume[i].valor;
			    valorResumo = parseFloat(valorResumo).toFixed(3);

				if (isNaN(valorResumo)) {
					valorResumo = "";
				}

				for (var j = 0; j < length; j++) {
					nomeTabelaResumo = "";
					nomeTabelaResumo = tabelaResumo.getItems()[j].getCells()[2].getProperty("text");
					if (nomeTabelaResumo === nomeResumo) {
						idVolume = "";
						idVolume = tabelaResumo.getItems()[j].getCells()[1].getId();
						this.getView().byId(idVolume).setValue(valorResumo);
					}
				}
			}
		},

		onEdit: function () {
			var tabelaResumo = this.getView().byId("listResumo");
			var length = tabelaResumo.getItems().length;
			var id;
			//var idDisponivel;

			for (var i = 0; i < length; i++) {
				id = tabelaResumo.getItems()[i].getCells()[1].getId();
				//idDisponivel = tabelaResumo.getItems()[i].getCells()[1].getId();
				this.getView().byId(id).setEditable(true);
				//this.getView().byId(idDisponivel).setVisible(true);
			}

			this.getView().byId("buttonCancel").setVisible(true);
			this.getView().byId("buttonEdit").setVisible(false);
			this.getView().byId("buttonSave").setVisible(true);
			//this.getView().byId("idColumnSaldo").setVisible(true);

			this.calculaTotal();
		},

		onCancela: function () {
			var tabelaResumo = this.getView().byId("listResumo");
			var length = tabelaResumo.getItems().length;
			var id;
			var idDisponivel;

			for (var i = 0; i < length; i++) {
				id = tabelaResumo.getItems()[i].getCells()[1].getId();
				this.getView().byId(id).setEditable(false);
			}

			this.getView().byId("buttonCancel").setVisible(false);
			this.getView().byId("buttonEdit").setVisible(true);
			this.getView().byId("buttonSave").setVisible(false);
		},

		onPressResumo: function () {
			if (!this.oInfoMessageDialog) {
				this.oInfoMessageDialog = new Dialog({
					type: DialogType.Message,
			//		id: "dialogConfirmaResumo2",
					title: "",
					showTitle: "false",
					state: ValueState.Information,
					content: new Text({
						text: "Confirm quote request?"
					}),
					beginButton: new Button({
						text: "Cancel",
			//			id: "botaoCancelarDialog2",
						class: "botaoCancelarDialog",
						press: function () {
							this.oInfoMessageDialog.close();
						}.bind(this)
					}),
					endButton: new Button({
						text: "Confirm",
			//			id: "botaoConfirmarDialog2",
						press: function () {
						   this.oInfoMessageDialog.close();	
							var msg = "Reload Processing";
							MessageToast.show(msg);
							this.onVoltarMaster();
							/*this.oInfoMessageDialog.close();
							this.sucesso();
							 oBusyDialog.open(0);*/
						}.bind(this)
					}),
					afterClose: function () {
						//this.oInfoMessageDialog.close();
					}
				});
			}

			this.oInfoMessageDialog.open();
		},

		calculaTotal: function () {
			var tabelaResumo = this.getView().byId("listResumo");
			var length = tabelaResumo.getItems().length;
			var total = 0;
			total = parseFloat(total, 2);
			var valor;
			var id;

			for (var i = 0; i < length; i++) {
				id = tabelaResumo.getItems()[i].getCells()[1].getId();
				valor = this.getView().byId(id).getValue();
				valor = parseFloat(valor, 2);
				if (valor > 0) {
					total = total + valor;
				}

			}
			
			total = parseFloat(total).toFixed(3);
			total = total + " Tons";
			this.getView().byId("idTotal").setText(total);
		},

		onSave: function () {
			this.gravaArray();
			this.calculaTotal();
		},

		validaConteudo: function () {
			var tabela = this.getView().byId("listResumo");
			var length = tabela.getItems().length;
			var nome;
			var valor;
			var valida;

			for (var i = 0; i < length; i++) {
				nome = tabela.getItems()[i].getCells()[0].getProperty("title");
				valor = tabela.getItems()[i].getCells()[1].getProperty("value");

				if (valor == 0) {
					valida = 0;
				} else {
					valida = 1;
					return valida;
				}

			}

			return valida;

		},

		gravaArray: function () {
			var tabela = this.getView().byId("listResumo");
			var length = tabela.getItems().length;
			var nome;
			var valor;
			var arrayVolume = this.buscarArraySolicitar();
			var lengthArray = arrayVolume.length;
			var nomeArray;
			var valida;
			var sai = 0;
			/*Valida Valores inicio
			 */
			var messagem = " Quantity field is empty !";
			var validaconteudo = this.validaConteudo();
			var saldo;
			var arraySaldo;

			if (validaconteudo == 0) {
				sap.m.MessageBox.error(messagem, {
					actions: ["OK", sap.m.MessageBox.Action.CLOSE],
					onClose: function (sAction) {}

				});

				tabela.getItems()[i].getCells()[1].setProperty("valueState", "Error");
				return;

			} else {

				tabela.getItems()[i].getCells()[1].setProperty("valueState", "None");

			}

			/*Valida Valores fim
			 */

			for (var i = 0; i < length; i++) {
				nome = tabela.getItems()[i].getCells()[0].getProperty("title");
				valor = tabela.getItems()[i].getCells()[1].getProperty("value");

				/*Inicio*/
				saldo = tabela.getItems()[i].getCells()[1].getProperty("placeholder");

				arraySaldo = saldo.split(":");
				saldo = arraySaldo[1];
				saldo = saldo.trim();
				saldo = parseFloat(saldo, 2);

				if (valor > saldo) {

					sap.m.MessageBox.error("Balance less than the transferred amount.", {
						actions: ["OK", sap.m.MessageBox.Action.CLOSE],
						onClose: function (sAction) {}
					});

					tabela.getItems()[i].getCells()[1].setProperty("valueState", "Error");

					return;
				} else {

					tabela.getItems()[i].getCells()[1].setProperty("valueState", "None");
				}

				/*Fim*/
				if (lengthArray !== 0) {

					for (var j = 0; j < lengthArray; j++) {
						nomeArray = arrayVolume[j].nome;
						valida = this.validaNome(nomeArray, nome);
						if (valida === 1) {
							sai = "1";
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
					}
				} else {
					arrayVolume.push({
						nome: nome,
						valor: valor
					});
				}
			}

			this.igualaArraySolicitar(arrayVolume);
			this.onCancela();
		},

		validaNome: function (inomeArray, inome) {
			if (inomeArray === inome) {
				return 1;
			} else {
				return 0;
			}
		},

		sucesso: function () {
			this.enviaEcc();
		},
	
			onVoltarMaster: function () {
			this.getRouter().navTo("master");
		},


		onVoltar: function () {
			var Kunnr = this.getView().byId("Kunnr").getText();
			var zchave = chave;
			var textskp = globalSkup;
			var textvbeln = globalVbeln;
			this.getRouter().navTo("Solicitar", {
				kunnr: Kunnr,
				Chave: zchave,
				ZzbrAtpskp: btoa(JSON.stringify(textskp)),
				vbeln: textvbeln,
				zuserid: zuserid

			}, true);
		},

		enviaEcc: function () {
			var oModel = this.getView().getModel();
			var Key;
			var oEntry = {};
			var retorno;
			var lista = this.getView().byId("listResumo");
			var length = lista.getItems().length;
			var aItems = lista.getItems();
			var that = this;

			for (var i = 0; i < length; i++) {

				if (lista.getItems()[i].getCells()[1].getProperty("value") !== "") {
					Key = "/solicita_cotaSet(Zchave='" + chave + "',Zgcdoador='" + lista.getItems()[i].getCells()[3].getProperty("text") + "')";
					oEntry = {};
					oEntry.ZzbrAtpskp = oModel.getProperty("ZzbrAtpskp", aItems[i].getBindingContext());
					oEntry.Kunn2 = this.getView().byId("Kunn2").getText();
					oEntry.Uom = this.getView().byId("Uom").getText();
					oEntry.BrQtdsolicitada = lista.getItems()[i].getCells()[1].getProperty("value");
					oEntry.Zqtddoada = "";
					oEntry.Status = "S";
					oEntry.Kunn2Name = this.getView().byId("Kunn2Name").getText();
					oEntry.ZgcdoadorName = lista.getItems()[i].getCells()[0].getProperty("title");
					oEntry.NameSkup = "";

					oModel.update(Key, oEntry, {
						success: function (oData, oResponse) {
							if (oResponse.statusCode === 204) {
								if (oResponse.statusCode === 204) {
									 oBusyDialog.close();
									that.getRouter().navTo("SolicitarSucesso", {
										kunnr: kunnr,
										Chave: chave,
										ZzbrAtpskp: btoa     (JSON.stringify(globalSkup)),
										vbeln: globalVbeln,
										zuserid: zuserid
									});
								}
							}
						},
						error: function (oError) {
							 oBusyDialog.close();
							var erro = oError;
							erro = erro.responseText;
							var erro2 = JSON.parse(erro);
							var messagem = erro2.error.message.value;
							sap.m.MessageBox.error(messagem, {
								actions: ["OK", sap.m.MessageBox.Action.CLOSE],
								onClose: function (sAction) {}
							});
							return;
						}
					});
				}
			}

		}

	});

});