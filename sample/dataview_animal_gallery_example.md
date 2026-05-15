---
title: "Dataview Gallery Example - Animal Tags"
category: Documentation
tags: [dataview, example, gallery, animal]
---

# Dataview Gallery Example: Query #animal Tag

This is an example of how to use Dataview to create a gallery view of images tagged with `#animal`.

## Dataview Query Code

```dataview
TABLE without id
"[[" & file.link & "|" & file.cover & "]]" as "Animal Images"
FROM "" 
WHERE contains(file.tags, "animal")
SORT file.mtime DESC
```

## Alternative: Gallery with Covers

```dataview
TABLE without id
"![[" & file.cover & "|300]]" as Cover,
file.link as Name,
file.tags as Tags
FROM "11_assets_OB"
WHERE contains(file.tags, "animal")
SORT file.ctime DESC
```

## Result Preview

When you have images tagged with `#animal` by the AI tagger, the query above will automatically display them as a gallery in your Obsidian note.

Example of what the AI generates (sidecar `.md` file):
```yaml
---
id: Pasted image 001
date: 2026-05-01
category: Nature
tags: [animal, wildlife, fox]
cover: Pasted image 001.png
linked_notes: []
processed_at: 2026-05-01 11:00:00
---
# Pasted image 001
A red fox sitting in a forest clearing during golden hour.
```

The `#animal` tag in the YAML frontmatter makes it queryable via Dataview!
