# Anchor Logo Icons

This directory contains the Anchor logo in multiple formats and sizes.

## Icon Files

### PNG (Used by extension)
- `icon16.png` - 16×16px - Toolbar icon (small)
- `icon48.png` - 48×48px - Extension management page
- `icon128.png` - 128×128px - Chrome Web Store listing
- `icon512.png` - 512×512px - High-res for promotional use

### SVG (Alternative/Source)
- `icon16.svg` - Scalable version (16px artboard)
- `icon48.svg` - Scalable version (48px artboard)
- `icon128.svg` - Scalable version (128px artboard)

## Design Specifications

**Anchor Symbol:**
- Maritime anchor representing stability and grounding
- Minimal, clean lines
- Professional and institutional aesthetic

**Colors:**
- Background: `#141a24` (dark navy)
- Anchor: `#8ca0c8` (light blue-gray)
- Opacity: Full opacity for clarity at small sizes

**Components:**
1. Ring at top (for rope/chain)
2. Vertical shaft (central stem)
3. Horizontal crossbar (stabilizer)
4. Curved flukes (bottom arms)
5. Fluke ends (angled tips)

## Usage

The PNG versions are referenced in `manifest.json`:
```json
"icons": {
  "16": "icons/icon16.png",
  "48": "icons/icon48.png",
  "128": "icons/icon128.png"
}
```

## Chrome Web Store Requirements

For Chrome Web Store submission, you also need:
- **128×128px** - Already included (`icon128.png`)
- **512×512px** - Included as `icon512.png` for promotional tiles
- **Promotional images** - Create separately (440×280, 920×680, 1400×560)

## Branding Guidelines

**When to use:**
- Extension icon in Chrome toolbar
- Extension management pages
- Chrome Web Store listing
- Marketing materials
- Documentation headers

**Minimum size:** 16×16px (maintain legibility)
**Maximum size:** No limit (SVG scales infinitely)

**Color variations:**
- Dark background version (current) - primary
- Light background version - create if needed for marketing
- Monochrome - acceptable for print/simple contexts

## Creating Custom Sizes

Use the provided Python script:
```bash
cd icons
python3 create-anchor-icons.sh
```

Or manually with image editor using SVG source files.

## Icon Metaphor

The anchor symbol represents:
- ⚓ **Stability** - Staying grounded in volatile markets
- ⚓ **Discipline** - Anchoring to your process and rules
- ⚓ **Professional standards** - Institutional-grade approach
- ⚓ **Calm mastery** - Not drifting from deliberate execution

The anchor is both functional (maritime tool) and symbolic (steadfast principles).

---

**Design Philosophy:** Simple, professional, memorable. The anchor should be recognizable at any size and reinforce the product's core message of disciplined trading.
