sap.ui.define([
	"exed/com/qotamanager/controller/BaseController", "sap/m/DialogType", "sap/ui/core/ValueState", "sap/m/Dialog", "sap/m/Button",
	"sap/m/ButtonType",
	"sap/m/Text", 'sap/m/MessageToast'
], function (BaseController, DialogType, ValueState, Dialog, Button, ButtonType, Text, MessageToast) {
	"use strict";

	var globalVbeln;
	var globalSkup;
	var zuserid;
	var oBusyDialog = new sap.m.BusyDialog();

	return BaseController.extend("exed.com.qotamanager.controller.ResumoCarteira", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf osc.view.ResumoCarteira
		 */
		onInit: function () {
			this.getRouter().getRoute("ResumoCarteira").attachPatternMatched(this._onObjectMatched, this);
		},

		_onObjectMatched: function (oEvent) {
			// MATCH DE TELA, CARREGANDO INFO DE CAMPOS DO SERVICO DE ORDEM DE VENDA
			var vbeln = oEvent.getParameter("arguments").vbeln;
			var chave = oEvent.getParameter("arguments").zchave;
			//	var skup = oEvent.getParameter("arguments").skup;
			var skup = JSON.parse(atob(oEvent.getParameter("arguments").skup));

			var zuser = oEvent.getParameter("arguments").zuserid;

			this.getView().byId("idTitleDependentes3").setText("Summary" + " - " + "(" + zuser + ")");

			globalVbeln = vbeln;
			globalSkup = skup;
			zuserid = zuser;
			this.bindatela(vbeln, skup, chave);
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

		_bindView: function (sObjectPath, iSkup) {
			// Set busy indicator during view binding
			var oViewModel = this.getModel();
			// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
			oViewModel.setProperty("/busy", false);

			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this, iSkup),
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
			this.executaFiltro(iSkup);
		},

		executaFiltro: function (iSkup) {
			var valor = iSkup;
			var kunnr = this.getView().byId("textkunnr").getText();
			var zsaldozero = "X";
			var filter = new sap.ui.model.Filter("ZzbrAtpskp", sap.ui.model.FilterOperator.EQ, valor);
			var filter1 = new sap.ui.model.Filter("Kunnr", sap.ui.model.FilterOperator.EQ, kunnr);
			var filter2 = new sap.ui.model.Filter("Zsaldozero", sap.ui.model.FilterOperator.EQ, zsaldozero);
			var filter3 = new sap.ui.model.Filter("Zuserid", sap.ui.model.FilterOperator.EQ, zuserid);
			var list = this.getView().byId("listResumo");
			list.getBinding("items").filter([filter, filter1, filter2, filter3]);
		},

		onModelContextChange: function () {
			this.buscaInfoRemanejar();
			this.calculaTotal();
		},

		buscaInfoRemanejar: function () {
			var tabelaResumo = this.getView().byId("listResumo");
			var length = tabelaResumo.getItems().length;
			var nomeResumo;
			var valorResumo;
			var nomeTabelaResumo;
			var idVolume;
			var arrayVolume = this.buscarArrayVolume();
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
					nomeTabelaResumo = tabelaResumo.getItems()[j].getCells()[3].getProperty("title");
					if (nomeTabelaResumo === nomeResumo) {
						idVolume = "";
						idVolume = tabelaResumo.getItems()[j].getCells()[2].getId();
						this.getView().byId(idVolume).setValue(valorResumo);
					}
				}
			}
		},

		onEdit: function () {
			var tabelaResumo = this.getView().byId("listResumo");
			var length = tabelaResumo.getItems().length;
			var id;
			var idDisponivel;

			for (var i = 0; i < length; i++) {
				id = tabelaResumo.getItems()[i].getCells()[2].getId();
				idDisponivel = tabelaResumo.getItems()[i].getCells()[1].getId();
				this.getView().byId(id).setEditable(true);
				this.getView().byId(idDisponivel).setVisible(true);
			}

			this.getView().byId("buttonCancel").setVisible(true);
			this.getView().byId("buttonEdit").setVisible(false);
			this.getView().byId("buttonSave").setVisible(true);
			this.getView().byId("idColumnSaldo").setVisible(true);

			this.calculaTotal();
		},

		onCancela: function () {
			var tabelaResumo = this.getView().byId("listResumo");
			var length = tabelaResumo.getItems().length;
			var id;
			var idDisponivel;

			for (var i = 0; i < length; i++) {
				id = tabelaResumo.getItems()[i].getCells()[2].getId();
				idDisponivel = tabelaResumo.getItems()[i].getCells()[1].getId();
				this.getView().byId(id).setEditable(false);
				this.getView().byId(idDisponivel).setVisible(false);
			}

			this.getView().byId("buttonCancel").setVisible(false);
			this.getView().byId("buttonEdit").setVisible(true);
			this.getView().byId("buttonSave").setVisible(false);
			this.getView().byId("idColumnSaldo").setVisible(false);
		},

		onPressResumo: function () {
			if (!this.oInfoMessageDialog) {
				this.oInfoMessageDialog = new Dialog({
					type: DialogType.Message,
					//		id: "dialogConfirmaResumo1",
					title: "",
					showTitle: "false",
					state: ValueState.Information,
					content: new Text({
						text: "Confirm quota reallocation?"
					}),
					beginButton: new Button({
						text: "Cancel",
						//			id: "botaoCancelarDialog1",
						class: "botaoCancelarDialog",
						press: function () {
							this.oInfoMessageDialog.close();
						}.bind(this)
					}),
					endButton: new Button({
						text: "Confirm",
						//			id: "botaoConfirmarDialog1",
						press: function () {
							this.oInfoMessageDialog.close();
							var msg = 'Reload Processing';
							MessageToast.show(msg);
							this.onVoltarMaster();
							//	this.sucesso();
							//	this.atualiza();
							//	oBusyDialog.open(0);
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
				id = tabelaResumo.getItems()[i].getCells()[2].getId();
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
			this.onCancela();
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
				valor = tabela.getItems()[i].getCells()[2].getProperty("value");

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
			var arrayVolume = this.buscarArrayVolume();
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
					actions: [sap.m.MessageBox.Action.CLOSE],
					onClose: function (sAction) {}

				});

			}

			/*Valida Valores fim
			 */

			for (var i = 0; i < length; i++) {
				nome = tabela.getItems()[i].getCells()[0].getProperty("title");
				valor = tabela.getItems()[i].getCells()[2].getProperty("value");
				/*Inicio*/
				saldo = tabela.getItems()[i].getCells()[1].getProperty("text");

				arraySaldo = saldo.split(":");
				saldo = arraySaldo[1];
				saldo = saldo.trim();
				saldo = parseFloat(saldo, 2);

				if (valor > saldo) {

					sap.m.MessageBox.error("Balance less than the transferred amount.", {
						actions: ["OK", sap.m.MessageBox.Action.CLOSE],
						onClose: function (sAction) {}

					});

					tabela.getItems()[i].getCells()[2].setProperty("valueState", "Error");

					return;
				} else {
					tabela.getItems()[i].getCells()[2].setProperty("valueState", "None");
				}

				/*Fim*/

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
		},

		validaNome: function (inomeArray, inome) {
			if (inomeArray === inome) {
				return 1;
			} else {
				return 0;
			}
		},

		sucesso: function () {
			var envia = this.enviaEcc();
		},

		atualiza: function () {
			var atualiza = this.atualizaEccApo();
		},
	
			onVoltarMaster: function () {
			this.getRouter().navTo("master");
		},

		onVoltar: function () {
			var chave = this.getView().byId("chave").getText();
			this.getRouter().navTo("Remanejar", {
				skup: btoa(JSON.stringify(globalSkup)),
				vbeln: globalVbeln,
				zuserid: zuserid,
				zchave: chave
			}, true);
		},

		atualizaEccApo: function () {
			var oModel = this.getView().getModel();
			var chave = this.getView().byId("chave").getText();
			var Key = "/ECCAPO_COTASet(Zchave='" + chave + "',Zuserid='" + zuserid + "')";

			var oEntry = {};
			var that = this;
			var skp = this.getView().byId("textskp").getText();
			oEntry.ZzbrAtpskp = skp;

			oModel.update(Key, oEntry, {
				success: function (oData, oResponse) {
					if (oResponse.statusCode === 204) {
						oBusyDialog.close();
						that.getRouter().navTo("RemanejamentoSucesso", {
							skup: btoa(JSON.stringify(globalSkup)),
							vbeln: globalVbeln,
							zuserid: zuserid,
							zchave: chave
						}, true);
					}
				},
				error: function (oError) {
					oBusyDialog.close();
					var erro = oError;
					erro = erro.responseText;
					var erro2 = JSON.parse(erro);
					var messagem = erro2.error.message.value;
					sap.m.MessageBox.error(messagem, {
						actions: [sap.m.MessageBox.Action.CLOSE],
						onClose: function (sAction) {}
					});
					return;
				}

			});

		},

		montaTabela: function () {
			var lista = this.getView().byId("listResumo");
			var aItems = lista.getItems();
			var length = aItems.length;
			var table = [];
			var sucessoTable = {};
			var sPath;
			var modelo = lista.getModel();
			// KunnrName, Ort01, Regio, Kunnr, ===== id= qtde

			this.Tabela = [];

			for (var i = 0; i < length; i++) {
				sPath = lista.getItems()[i].getBindingContextPath();
				sPath = sPath.replace("/", "");

				sucessoTable = {
					KunnrName: modelo.oData[sPath].KunnrName,
					Ort01: modelo.oData[sPath].Ort01,
					Regio: modelo.oData[sPath].Regio,
					Kunnr: modelo.oData[sPath].Kunnr,
					Qtde: lista.getItems()[i].getCells()[2].getProperty("value")
				}

				table.push(sucessoTable);
			}

			this.Tabela = table;
			this.carregaLista(this.Tabela);
		},

		enviaEcc: function () {
			var oModel = this.getView().getModel();
			var chave = this.getView().byId("chave").getText();
			/*	var Key = "/transfere_cotaSet(Zchave='" + chave + "')";*/

			var Key = "/transferenciaSet(Zchave='" + chave + "',Zuserid='" + zuserid + "')";

			var oEntry = {};
			var lista = this.getView().byId("listResumo");
			var length = lista.getItems().length;
			var aItems = lista.getItems();
			var valor;
			var that = this;

			this.montaTabela();

			for (var i = 0; i < length; i++) {
				valor = "";
				valor = lista.getItems()[i].getCells()[2].getProperty("value");
				valor = parseFloat(valor).toFixed(3);
				/*if (valor !== "" ) {*/
				if (valor !== "NaN") {
					oEntry = {};
					oEntry.Kunn2 = oModel.getProperty("Kunn2", aItems[i].getBindingContext());
					oEntry.Kunnr = oModel.getProperty("Kunnr", aItems[i].getBindingContext());
					oEntry.BrAtppkt = oModel.getProperty("BrAtppkt", aItems[i].getBindingContext());
					oEntry.ZzbrAtpskp = oModel.getProperty("ZzbrAtpskp", aItems[i].getBindingContext());
					oEntry.Ort01 = oModel.getProperty("Ort01", aItems[i].getBindingContext());
					oEntry.Regio = oModel.getProperty("Regio", aItems[i].getBindingContext());
					oEntry.Vbeln = globalVbeln;
					oEntry.BrQtdsolicitada = valor;
					oEntry.Uom = oModel.getProperty("Uom", aItems[i].getBindingContext());
					oEntry.Zuserid = zuserid;

					oModel.update(Key, oEntry, {
						success: function (oData, oResponse) {
							/*if (oResponse.statusCode === 204) {
								that.getRouter().navTo("RemanejamentoSucesso", {
									skup: globalSkup,
									vbeln: globalVbeln
								}, true);
							}*/
						},
						error: function (oError) {
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