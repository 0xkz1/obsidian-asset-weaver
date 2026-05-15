# Dataview Integration Guide

After AssetWeaver processes your images, you can use [Dataview](https://github.com/blacksmithgu/obsidian-dataview) to create smart galleries and query your assets by tags, categories, and other metadata.

---

## What AssetWeaver Creates

Before diving into Dataview queries, it helps to understand what AssetWeaver produces. Each image gets a sidecar `.md` file with structured YAML frontmatter — including English titles, categories, tags, and a `cover` field referencing the original image.

### At Scale: From Mess to Library

Thousands of generic filenames (`Pasted image 1.png`, `Screenshot 2026-05-11 at 23.15.58.png`) become a categorized, searchable collection with meaningful titles and metadata.

![Before Directory](../sample/before_directory.png)
![After Directory](../sample/after_directory.png)

### Per Asset: From Image to Structured Data

See the main [README](../README.md#visual-comparison-before-vs-after) for a side-by-side comparison of how a raw image gets transformed into YAML frontmatter (title, tags, description, backlinks).

---

## Dataview Gallery Query

Here's how to query images tagged with `#animal` and display them as a gallery:

### Query

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

### Result Preview

![Animal Gallery Example](../sample/gallery_animal.png)

See [`sample/dataview_animal_gallery_example.md`](../sample/dataview_animal_gallery_example.md) for a complete working example.

> **Tip**: AssetWeaver automatically adds tags like `#animal`, `#landscape`, `#portrait`, etc. to your image metadata. Use Dataview to build custom views!
