# Local preview server for the Heidt Studio site.
# Needs nothing but Windows PowerShell. Run START-PREVIEW.bat, or:
#   powershell -ExecutionPolicy Bypass -File preview-server.ps1 [-Port 8080] [-NoBrowser]
param([int]$Port = 8080, [switch]$NoBrowser)
$ErrorActionPreference = "Stop"
$root = [System.IO.Path]::GetFullPath($PSScriptRoot)

$mime = @{
  ".html" = "text/html; charset=utf-8"; ".js" = "text/javascript; charset=utf-8";
  ".css" = "text/css; charset=utf-8"; ".png" = "image/png"; ".jpg" = "image/jpeg";
  ".jpeg" = "image/jpeg"; ".webp" = "image/webp"; ".svg" = "image/svg+xml";
  ".ico" = "image/x-icon"; ".mp4" = "video/mp4"; ".woff2" = "font/woff2";
  ".json" = "application/json"; ".txt" = "text/plain; charset=utf-8"; ".xml" = "application/xml"
}

$listener = New-Object System.Net.HttpListener
$last = $Port + 10
while ($Port -lt $last) {
  try { $listener.Prefixes.Clear(); $listener.Prefixes.Add("http://localhost:$Port/"); $listener.Start(); break }
  catch { $Port++ }
}
if (-not $listener.IsListening) { Write-Host "Could not start the preview server (ports busy)."; exit 1 }

$url = "http://localhost:$Port/"
Write-Host "Heidt Studio preview running at $url"
Write-Host "Leave this window open while you look around. Close it to stop."
if (-not $NoBrowser) { Start-Process $url }

while ($listener.IsListening) {
  try {
    $ctx = $listener.GetContext()
    $rel = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart("/")
    if ($rel -eq "") { $rel = "index.html" }
    $path = [System.IO.Path]::GetFullPath((Join-Path $root ($rel -replace "/", "\")))
    if ((Test-Path $path -PathType Container)) { $path = Join-Path $path "index.html" }
    if ($path.StartsWith($root, [StringComparison]::OrdinalIgnoreCase) -and (Test-Path $path -PathType Leaf)) {
      $ext = [System.IO.Path]::GetExtension($path).ToLower()
      $ctx.Response.ContentType = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { "application/octet-stream" }
      $ctx.Response.Headers["Cache-Control"] = "no-cache"
      $ctx.Response.Headers["Accept-Ranges"] = "bytes"
      $bytes = [System.IO.File]::ReadAllBytes($path)
      $start = 0; $end = $bytes.Length - 1
      # Byte ranges let browsers seek and loop the hero video, like a real web host does
      $range = $ctx.Request.Headers["Range"]
      if ($range -match '^bytes=(\d*)-(\d*)$') {
        if ($Matches[1] -ne "") { $start = [int64]$Matches[1]; if ($Matches[2] -ne "") { $end = [Math]::Min([int64]$Matches[2], $end) } }
        elseif ($Matches[2] -ne "") { $start = [Math]::Max(0, $bytes.Length - [int64]$Matches[2]) }
        $ctx.Response.StatusCode = 206
        $ctx.Response.Headers["Content-Range"] = "bytes $start-$end/$($bytes.Length)"
      }
      $len = $end - $start + 1
      $ctx.Response.ContentLength64 = $len
      $ctx.Response.OutputStream.Write($bytes, [int]$start, [int]$len)
    } else {
      $ctx.Response.StatusCode = 404
    }
    $ctx.Response.Close()
  } catch { }
}
