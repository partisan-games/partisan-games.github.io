# Reapply only the generated patch to the original or already retouched battlefield.
$ErrorActionPreference = 'Stop'
$plate = Join-Path $PSScriptRoot '../../../background/sremski-front-1945-static.png'
$patch = Join-Path $PSScriptRoot 'retouch.png'
$result = Join-Path ([IO.Path]::GetTempPath()) ("srem-{0}.png" -f [guid]::NewGuid())
try {
  & magick $plate $patch -geometry '+1241+481' -compose over -composite -strip "PNG24:$result"
  if ($LASTEXITCODE -ne 0) { throw 'ImageMagick could not apply the retouch.' }
  Copy-Item -LiteralPath $result -Destination $plate
} finally {
  if (Test-Path -LiteralPath $result) { Remove-Item -LiteralPath $result }
}
