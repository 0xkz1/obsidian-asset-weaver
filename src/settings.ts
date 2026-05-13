import {App, PluginSettingTab, Setting} from "obsidian";
import AssetWeaverPlugin from "./main";

export interface AssetWeaverSettings {
	apiBaseUrl: string;
	modelName: string;
	apiKey: string;
	targetFolder: string;
}

export const DEFAULT_SETTINGS: AssetWeaverSettings = {
	apiBaseUrl: 'http://localhost:11434/v1',
	modelName: 'qwen2-vl:7b',
	apiKey: 'dummy-key',
	targetFolder: '11_assets_OB'
}

export class AssetWeaverSettingTab extends PluginSettingTab {
	plugin: AssetWeaverPlugin;

	constructor(app: App, plugin: AssetWeaverPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('API base URL')
			.setDesc('Base URL of your local VLM server (e.g., http://localhost:11434/v1).')
			.addText(text => text
				.setPlaceholder('Enter the API base URL')
				.setValue(this.plugin.settings.apiBaseUrl)
				.onChange(async (value) => {
					this.plugin.settings.apiBaseUrl = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Model name')
			.setDesc('Name of the vision-language model loaded on your local server.')
			.addText(text => text
				.setPlaceholder('Enter the model name')
				.setValue(this.plugin.settings.modelName)
				.onChange(async (value) => {
					this.plugin.settings.modelName = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('API key')
			.setDesc('API key for authentication (use any dummy value for local servers).')
			.addText(text => text
				.setPlaceholder('Enter the API key')
				.setValue(this.plugin.settings.apiKey)
				.onChange(async (value) => {
					this.plugin.settings.apiKey = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Target folder')
			.setDesc('Vault folder path containing the images you want to tag.')
			.addText(text => text
				.setPlaceholder('Enter the folder path')
				.setValue(this.plugin.settings.targetFolder)
				.onChange(async (value) => {
					this.plugin.settings.targetFolder = value;
					await this.plugin.saveSettings();
				}));
	}
}
