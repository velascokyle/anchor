#!/bin/bash
# Create placeholder icons using ImageMagick
convert -size 16x16 xc:"#141a24" -fill "#8ca0c8" -draw "rectangle 4,4 12,12" icon16.png
convert -size 48x48 xc:"#141a24" -fill "#8ca0c8" -draw "rectangle 12,12 36,36" icon48.png
convert -size 128x128 xc:"#141a24" -fill "#8ca0c8" -draw "rectangle 32,32 96,96" icon128.png
