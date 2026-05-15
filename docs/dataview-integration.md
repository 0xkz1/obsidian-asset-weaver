# Dataview Integration Guide

After AssetWeaver processes your images, you can use [Dataview](https://github.com/blacksmithgu/obsidian-dataview) to create smart galleries and query your assets by tags, categories, and other metadata.

---

## 1. Library-Scale Transformation (Macro View)

AssetWeaver automatically renames and indexes generic filenames (e.g., `Pasted image...`) into a categorized, searchable library.

### Before: Unorganized Generic Filenames

No context, difficult to search, and cluttered filesystem.

![Before Directory](../sample/before_directory.png)

### After: Categorized & Searchable Library

AI-driven English titles and sidecar metadata for every asset.

![After Directory](../sample/after_directory.png)

---

## 2. Asset Enrichment (Micro View)

See the main [README](../README.md#visual-comparison-before-vs-after) for the Before/After comparison of individual image processing — how a raw image gets transformed into structured YAML frontmatter.

---

## 3. Dataview Gallery Query

After AssetWeaver processes your images, you can use Dataview to create smart galleries. Here's how to query images tagged with `#animal`:

### Example Query (Dataview)

```dataview
TABLE without id
"![[" & file.cover & "|300]]" as Cover,
file.link as Name,
file.tags as Tags
FROM "11_assets_OB"
WHERE contains(file.tags, "animal")
SORT file.ctime DESC
```

### What This Does

1. **Scans** all `.md` sidecar files in `11_assets_OB/`
2. **Filters** for files containing `#animal` in their tags
3. **Displays** a gallery with cover images (300px width)
4. **Links** to the full metadata file for each asset

### Sample Result

Here's an example of what your Dataview gallery looks like with `#animal` tagged assets:

![Animal Gallery Example](../sample/gallery_animal.png)

See [`sample/dataview_animal_gallery_example.md`](../sample/dataview_animal_gallery_example.md) for a complete working example.

> **Tip**: AssetWeaver automatically adds tags like `#animal`, `#landscape`, `#portrait`, etc. to your image metadata. Use Dataview to build custom views!
