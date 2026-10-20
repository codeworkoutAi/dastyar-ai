Add-Type -AssemblyName System.Drawing

function Optimize-JpegFile {
    param (
        [string]$FilePath,
        [int]$MaxDimension = 800,
        [long]$Quality = 78
    )

    $fullPath = (Get-Item $FilePath).FullName
    $oldSize = (Get-Item $fullPath).Length

    # Load image
    $original = [System.Drawing.Image]::FromFile($fullPath)
    $origWidth = $original.Width
    $origHeight = $original.Height

    # Calculate new dimensions if larger than MaxDimension
    $newWidth = $origWidth
    $newHeight = $origHeight

    if ($origWidth -gt $origHeight) {
        if ($origWidth -gt $MaxDimension) {
            $newWidth = $MaxDimension
            $newHeight = [int]($origHeight * ($MaxDimension / $origWidth))
        }
    } else {
        if ($origHeight -gt $MaxDimension) {
            $newHeight = $MaxDimension
            $newWidth = [int]($origWidth * ($MaxDimension / $origHeight))
        }
    }

    # Create new bitmap with high quality interpolation
    $bitmap = New-Object System.Drawing.Bitmap($newWidth, $newHeight)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    $graphics.DrawImage($original, 0, 0, $newWidth, $newHeight)

    # Setup encoder for JPEG
    $encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
    $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, $Quality)

    $original.Dispose()

    # Save to temp file first, then overwrite
    $tempPath = "$fullPath.tmp.jpg"
    $bitmap.Save($tempPath, $encoder, $encoderParams)

    $graphics.Dispose()
    $bitmap.Dispose()

    $newSize = (Get-Item $tempPath).Length

    if ($newSize -lt $oldSize) {
        Move-Item -Path $tempPath -Destination $fullPath -Force
        $oldKb = [math]::Round($oldSize / 1KB, 1)
        $newKb = [math]::Round($newSize / 1KB, 1)
        $pct = [math]::Round((($oldSize - $newSize) / $oldSize) * 100, 1)
        Write-Host "Optimized: $FilePath ($origWidth x $origHeight -> $newWidth x $newHeight) : $oldKb KB -> $newKb KB (-$pct%)"
    } else {
        Remove-Item -Path $tempPath -Force
        Write-Host "Kept original (already optimal): $FilePath"
    }
}

Write-Host "=== Optimizing studio-presets ==="
Get-ChildItem -Path "public/studio-presets" -Filter "*.jpg" | ForEach-Object {
    if ($_.Length -gt 100KB) {
        Optimize-JpegFile -FilePath $_.FullName -MaxDimension 600 -Quality 75
    }
}

Write-Host "`n=== Optimizing public/images ==="
Get-ChildItem -Path "public/images" -Recurse -Filter "*.jpg" | ForEach-Object {
    if ($_.Length -gt 100KB) {
        Optimize-JpegFile -FilePath $_.FullName -MaxDimension 800 -Quality 75
    }
}
