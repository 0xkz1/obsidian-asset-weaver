import {App, Notice, Plugin, TFile, TFolder, requestUrl, arrayBufferToBase64} from 'obsidian';
import {DEFAULT_SETTINGS, AssetWeaverSettings, AssetWeaverSettingTab} from "./settings";

export default class AssetWeaverPlugin extends Plugin {
	settings: AssetWeaverSettings;

	async onload() {
		console.log('Loading AssetWeaver plugin');
		await this.loadSettings();

		// Add a ribbon icon to the left sidebar
		this.addRibbonIcon('image-plus', 'Run AssetWeaver', (evt: MouseEvent) => {
			this.processImages();
		});

		// Add a command to the command palette
		this.addCommand({
			id: 'run-asset-weaver',
			name: 'Scan and weave new assets',
			callback: () => {
				this.processImages();
			}
		});

		// Register the settings tab
		this.addSettingTab(new AssetWeaverSettingTab(this.app, this));
	}

	onunload() {
		console.log('Unloading AssetWeaver plugin');
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<AssetWeaverSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	// Helper function to remove special characters from filenames
	sanitizeFilename(name: string): string {
		return name.replace(/[\\/*?:"<>|]/g, "").trim();
	}

	// Helper function to format tags into an array
	sanitizeTags(tags: any): string[] {
		if (Array.isArray(tags)) {
			return tags.map(tag => String(tag).trim().replace(/\s+/g, "-").toLowerCase()).filter(tag => tag);
		}
		if (typeof tags === 'string') {
			return tags.split(/[,，、]+/).map(tag => tag.trim().replace(/\s+/g, "-").toLowerCase()).filter(tag => tag);
		}
		return [];
	}

	// Main processing logic
	async processImages() {
		const targetFolderPath = this.settings.targetFolder;
		
		// Extract files directly under the target folder from the vault
		const allFilesInVault = this.app.vault.getFiles();
		const filesInTarget = allFilesInVault.filter(f => f.parent && f.parent.path === targetFolderPath);

		if (filesInTarget.length === 0) {
			new Notice(`Error: No files found in target folder "${targetFolderPath}".`);
			return;
		}

		const imageExtensions = ['png', 'jpg', 'jpeg', 'webp', 'gif'];
		const images = filesInTarget.filter(f => imageExtensions.includes(f.extension.toLowerCase()));
		const mds = filesInTarget.filter(f => f.extension.toLowerCase() === 'md');

		let unTaggedImages: TFile[] = [];

		for (let img of images) {
			const baseName = img.basename;
			// Check if a sidecar markdown file already exists (exact match or starts with "basename - ")
			const hasSidecar = mds.some(md => 
				md.basename === baseName || 
				md.basename.startsWith(`${baseName} - `) ||
				md.basename.startsWith(`${baseName}-`)
			);
			if (!hasSidecar) unTaggedImages.push(img);
		}

		if (unTaggedImages.length === 0) {
			new Notice('🎉 All images are already tagged!');
			return;
		}

		new Notice(`🚀 Found ${unTaggedImages.length} un-tagged images. Starting batch processing...`);

		// Process images sequentially to avoid overloading the local VLM server
		let count = 0;
		for (const imgFile of unTaggedImages) {
			count++;
			new Notice(`Processing (${count}/${unTaggedImages.length}): ${imgFile.name}`);
			
			try {
				await this.tagSingleImage(imgFile, targetFolderPath);
			} catch (e) {
				console.error(e);
			}

			// Add a delay between requests to reduce server load
			if (count < unTaggedImages.length) {
				await new Promise(resolve => setTimeout(resolve, 1000));
			}
		}

		new Notice('✅ Batch processing complete!');
	}

	// Helper function to resize image and convert to Base64
	async resizeImageToBase64(binary: ArrayBuffer, mimeType: string, maxSize: number = 768): Promise<string> {
		return new Promise((resolve, reject) => {
			const blob = new Blob([binary], { type: mimeType });
			const url = URL.createObjectURL(blob);
			const img = new Image();
			
			img.onload = () => {
				URL.revokeObjectURL(url);
				let width = img.width;
				let height = img.height;

				if (width > maxSize || height > maxSize) {
					if (width > height) {
						height = Math.round((height * maxSize) / width);
						width = maxSize;
					} else {
						width = Math.round((width * maxSize) / height);
						height = maxSize;
					}
				}

				const canvas = document.createElement('canvas');
				canvas.width = width;
				canvas.height = height;
				const ctx = canvas.getContext('2d');
				if (!ctx) {
					reject(new Error("Could not get canvas context"));
					return;
				}
				
				// Draw and compress as JPEG
				ctx.drawImage(img, 0, 0, width, height);
				const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
				
				// Remove the 'data:image/jpeg;base64,' prefix
				const base64 = dataUrl.split(',')[1];
				resolve(base64 || '');
			};
			
			img.onerror = (e) => {
				URL.revokeObjectURL(url);
				reject(e);
			};
			
			img.src = url;
		});
	}

	async tagSingleImage(imgFile: TFile, folderPath: string) {
		try {
			// Read image as binary and compress/resize it
			const binary = await this.app.vault.readBinary(imgFile);
			
			if (binary.byteLength === 0) {
				throw new Error("File is empty (0 bytes). Skipping.");
			}

			let mimeType = imgFile.extension.toLowerCase() === 'png' ? 'image/png' : 'image/jpeg';
			if (imgFile.extension.toLowerCase() === 'webp') mimeType = 'image/webp';
			if (imgFile.extension.toLowerCase() === 'gif') mimeType = 'image/gif';

			const base64Image = await this.resizeImageToBase64(binary, mimeType, 768);
			// After resizing, it's always converted to jpeg by the canvas
			const finalMimeType = 'image/jpeg';

			const prompt = `Analyze this image and provide a structured English classification:
1. title: Short English title (max 5 words).
2. category: Photography, Art, Nature, Tech, Document, Finance, People, or Gaming.
3. tags: 3-5 keywords in English (use hyphens for spaces).
4. description: One sentence English description.

Output ONLY valid JSON format.
CRITICAL: Do not use unescaped double quotes inside the JSON strings. Use single quotes instead if needed.`;

			const payload = {
				model: this.settings.modelName,
				messages: [
					{
						role: "user",
						content: [
							{ type: "text", text: prompt },
							{ type: "image_url", image_url: { url: `data:${finalMimeType};base64,${base64Image}` } }
						]
					}
				],
				temperature: 0.2
			};

			new Notice(`Sending ${imgFile.name} to VLM...`);

			// Send POST request to the VLM API
			const response = await requestUrl({
				url: `${this.settings.apiBaseUrl}/chat/completions`,
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${this.settings.apiKey}`
				},
				body: JSON.stringify(payload)
			});

			const responseContent = response.json.choices[0].message.content;
			const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
			if (!jsonMatch) throw new Error("VLM did not return a JSON object.");
			
			let jsonString = jsonMatch[0];
			// Basic cleanup for common unescaped quote issues in VLM outputs
			jsonString = jsonString.replace(/:\s*"([^"]*)"([^",}\]]+)"([^"]*)"/g, ': "$1\'$2\'$3"');
			
			const analysis = JSON.parse(jsonString);

			// Extract metadata from the AI response
			const title = this.sanitizeFilename(analysis.title || 'Untitled');
			const tags = this.sanitizeTags(analysis.tags || []);
			const category = analysis.category || 'Unclassified';
			const description = analysis.description || '';
			const timestamp = window.moment().format("YYYY-MM-DD HH:mm");

			// Retrieve backlinks (notes that reference this image)
			const linkedNotes: string[] = [];
			const allMdFiles = this.app.vault.getMarkdownFiles();
			
			for (const file of allMdFiles) {
				// Exclude the sidecar markdown file itself
				if (file.basename.startsWith(`${imgFile.basename} - `)) continue;

				const cache = this.app.metadataCache.getFileCache(file);
				if (!cache) continue;

				let isLinked = false;
				// Check for standard links e.g., [[image.jpg]]
				if (cache.links && cache.links.some(l => l.link.includes(imgFile.name))) {
					isLinked = true;
				}
				// Check for embeds e.g., ![[image.jpg]]
				if (cache.embeds && cache.embeds.some(e => e.link.includes(imgFile.name))) {
					isLinked = true;
				}

				if (isLinked) {
					linkedNotes.push(file.basename);
				}
			}

			const linkedNotesYaml = linkedNotes.length > 0 
				? "\n" + linkedNotes.map(n => `  - "[[${n}]]"`).join("\n")
				: "[]";

			// Format metadata for the markdown file
			const tagsString = tags.length > 0 ? `['${tags.join("', '")}']` : "[]";
			const mdName = `${imgFile.basename} - ${title}.md`;

			const mdContent = `---
title: ${title}
category: ${category}
tags: ${tagsString}
cover: "${imgFile.name}"
linked_notes:${linkedNotesYaml}
processed_at: ${timestamp}
---
![[${imgFile.name}]]

${description}
`;

			await this.app.vault.create(`${folderPath}/${mdName}`, mdContent);
			new Notice(`Successfully created: ${mdName}`);

		} catch (error: any) {
			console.error(`Error processing ${imgFile.name}:`, error);
			
			let errorMsg = "Unknown error";
			if (error instanceof Error) {
				errorMsg = error.message;
			} else if (error && error.status) {
				// HTTP Error from requestUrl
				errorMsg = `HTTP ${error.status} - ${error.text || 'Bad Request'}`;
			} else if (typeof error === 'object') {
				try { errorMsg = JSON.stringify(error); } catch (e) { errorMsg = "Object stringify failed"; }
			} else if (typeof error === 'string') {
				errorMsg = error;
			}

			new Notice(`Failed: ${imgFile.name} - ${errorMsg}`);
		}
	}
}
