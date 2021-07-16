const vscode = require("vscode");
const fs = require("fs");
let outputTerminal = vscode.window.createOutputChannel("Full LWC Creator");

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	let disposable = vscode.commands.registerCommand("full-lwc-creator.createFullLwc", async () => {
		let userInputs = {};
		let content = {};
		let params = {};

		vscode.window.showInformationMessage("...creating LWC. Please enter required information on user prompt when asked...");
		let fileName = await vscode.window.showInputBox({ placeHolder: "Enter desired component name" });
		if (fileName === "") {
			vscode.window.showErrorMessage("Please choose a valid name for the component and try again. Component Name cannot be empty or null");
			return;
		} else {
			userInputs.fileName = fileName;
			userInputs.className = fileName[0].toUpperCase() + fileName.substring(1);
		}

		let createCSS = await vscode.window.showInputBox({ placeHolder: "Create a css file for the specified component? (Y/N - Default Y)" });
		if (createCSS != "Y" || createCSS != "N") {
			if (createCSS === "") {
				createCSS = "Y";
				userInputs.createCSS = createCSS;
			} else if (createCSS === "n" || createCSS === "N") {
				createCSS = "N";
				userInputs.createCSS = createCSS;
			} else if (createCSS === "y" || createCSS === "Y") {
				createCSS = "Y";
				userInputs.createCSS = createCSS;
			} else {
				vscode.window.showErrorMessage("Invalid Option, please try again using Y or N");
				return;
			}
		}
		outputTerminal.appendLine(`CSS: ${createCSS} Filename: ${fileName}`);

		let filePath = await vscode.window.showInputBox({ placeHolder: "Enter desired directory or Enter to use Default (/force-app/main/default/lwc)" });
		if (filePath === "") {
			filePath = `/force-app/main/default/lwc/${userInputs.fileName}`;
			userInputs.filePath = filePath;
		} else {
			userInputs.filePath = filePath;
		}

		let workingFolder;
		if (vscode.workspace.workspaceFolders !== undefined) {
			let wf = vscode.workspace.workspaceFolders[0].uri.path;
			let f = vscode.workspace.workspaceFolders[0].uri.fsPath;

			if (wf) {
				workingFolder = wf;
			} else if (f) {
				workingFolder = f;
			} else {
				throw "Unable to find opened folder";
			}
		} else {
			message = "YOUR-EXTENSION: Working folder not found, open a folder an try again";
			outputTerminal.appendLine(message);
		}
		params.workingFolder = workingFolder;

		if (process.platform === "darwin" || process.platform === "linux") {
			params.componentFolder = `${params.workingFolder}${userInputs.filePath}`;
		} else if (process.platform === "win32") {
			params.workingFolder = params.workingFolder.substring(1);
			params.componentFolder = `${params.workingFolder}${userInputs.filePath}`;
		}

		if (!fs.existsSync(params.componentFolder)) {
			fs.mkdir(params.componentFolder, { recursive: true }, function (err) {
				if (err) {
					outputTerminal.appendLine(err);
					vscode.window.showInformationMessage("Error: "+err);
					throw err;
				} else {
					outputTerminal.appendLine("New directory successfully created.");
				}
			});
		} else {
			outputTerminal.appendLine("Folder already exists");
		}

		let apiVersion = await vscode.window.showInputBox({ placeHolder: "Enter desired API Version or Enter to use Project Default (sfdx-project.json)" });
		if (apiVersion != "") {
			userInputs.apiVersion = apiVersion;
			await generateContent(params);
		} else {
			let filePath;
			process.platform === "win32" ? filePath = workingFolder.substring(3) : filePath = workingFolder;
			fs.readFile(`${filePath}/sfdx-project.json`, "utf8", async function (err, data) {
				if (err) {
					throw err;
				} else {
					outputTerminal.show();
					let obj = await JSON.parse(data);
					let retrievedVersion = obj.sourceApiVersion;
					userInputs.apiVersion = retrievedVersion;
					await generateContent(params);
				}
			});
		}

		async function generateContent(params) {
			let parameters = params;
			content.html = `<template>
<!-- Component created using Full LWC Creator -->
</template>`;

			content.js = `import { LightningElement } from 'lwc';
export default class ${userInputs.className} extends LightningElement {
//Component created using Full LWC Creator
}`;

			content.css = `/* Component created using Full LWC Creator */`;

			content.xml = `<?xml version="1.0" encoding="UTF-8" ?>
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
<apiVersion>${userInputs.apiVersion}</apiVersion>
<isExposed>true</isExposed>
<targets>
	<target>lightning__RecordPage</target>
	<target>lightning__AppPage</target>
	<target>lightning__HomePage</target>
</targets>
</LightningComponentBundle>`;
			outputTerminal.appendLine(parameters);
			createFiles(userInputs, parameters, content);
		}
	});

	function createFiles(userInputs, params, content) {
		if (userInputs.createCSS === "Y") {
			outputTerminal.appendLine(`Creating CSS FILE: ${params.componentFolder}/${userInputs.fileName}.css`);
			fs.appendFile(`${params.componentFolder}/${userInputs.fileName}.css`, content.css, function (err) {
				if (err) throw err;
			});
		}
		outputTerminal.appendLine(`Creating HTML FILE: ${params.componentFolder}/${userInputs.fileName}.html`);
		fs.appendFile(`${params.componentFolder}/${userInputs.fileName}.html`, content.html, function (err) {
			if (err) throw err;
		});

		outputTerminal.appendLine(`Creating JS FILE: ${params.componentFolder}/${userInputs.fileName}.js`);
		fs.appendFile(`${params.componentFolder}/${userInputs.fileName}.js`, content.js, function (err) {
			if (err) throw err;
		});

		outputTerminal.appendLine(`Creating XML FILE: ${params.componentFolder}/${userInputs.fileName}.js-meta.xml`);
		fs.appendFile(`${params.componentFolder}/${userInputs.fileName}.js-meta.xml`, content.xml, function (err) {
			if (err) throw err;
		});
		vscode.window.showInformationMessage("LWC created successfully");
	}
	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
};
