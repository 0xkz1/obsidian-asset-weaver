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
		
		containerEl.createEl('h2', {text: 'AssetWeaver Settings'});

		new Setting(containerEl)
			.setName('API Base URL')
			.setDesc('The base URL for your local or remote OpenAI-compatible VLM API. Example: http://localhost:11434/v1 for Ollama.')
			.addText(text => text
				.setPlaceholder('http://localhost:11434/v1')
				.setValue(this.plugin.settings.apiBaseUrl)
				.onChange(async (value) => {
					this.plugin.settings.apiBaseUrl = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Model Name')
			.setDesc('The name of the Vision-Language Model to use. Example: qwen2-vl:7b, llava, or gemini-1.5-flash.')
			.addText(text => text
				.setPlaceholder('qwen2-vl:7b')
				.setValue(this.plugin.settings.modelName)
				.onChange(async (value) => {
					this.plugin.settings.modelName = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('API Key')
			.setDesc('Your API key. If using local Ollama, you can leave this as a dummy key.')
			.addText(text => text
				.setPlaceholder('Enter your API key')
				.setValue(this.plugin.settings.apiKey)
				.onChange(async (value) => {
					this.plugin.settings.apiKey = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Target Folder')
			.setDesc('The folder in your vault where your un-tagged images are stored.')
			.addText(text => text
				.setPlaceholder('11_assets_OB')
				.setValue(this.plugin.settings.targetFolder)
				.onChange(async (value) => {
					this.plugin.settings.targetFolder = value;
					await this.plugin.saveSettings();
				}));
	}
}
