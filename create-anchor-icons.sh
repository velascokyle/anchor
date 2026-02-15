#!/bin/bash
# Create Anchor logo icons using ImageMagick with SVG

# Create SVG logo first
cat > /tmp/anchor-logo.svg << 'EOF'
<svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
  <rect width="128" height="128" fill="#141a24"/>
  <g transform="translate(64, 64)">
    <!-- Anchor symbol -->
    <g fill="none" stroke="#8ca0c8" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
      <!-- Ring at top -->
      <circle cx="0" cy="-30" r="10"/>
      <!-- Vertical shaft -->
      <line x1="0" y1="-20" x2="0" y2="35"/>
      <!-- Anchor flukes (bottom curved arms) -->
      <path d="M -25 25 Q 0 45, 25 25" stroke-width="5"/>
      <!-- Fluke ends -->
      <line x1="-25" y1="25" x2="-30" y2="15"/>
      <line x1="25" y1="25" x2="30" y2="15"/>
      <!-- Horizontal crossbar -->
      <line x1="-20" y1="15" x2="20" y2="15" stroke-width="5"/>
    </g>
  </g>
</svg>
EOF

# Convert SVG to PNG at different sizes
convert -background none /tmp/anchor-logo.svg -resize 16x16 icon16.png
convert -background none /tmp/anchor-logo.svg -resize 48x48 icon48.png
convert -background none /tmp/anchor-logo.svg -resize 128x128 icon128.png

echo "Icons created successfully"
