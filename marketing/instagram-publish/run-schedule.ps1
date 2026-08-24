# .env faylini o'qib muhit o'zgaruvchilariga yuklaydi, keyin schedule-publish.mjs'ni
# ishga tushiradi. Task Scheduler shu skriptni chaqiradi — shunda token buyruq
# qatorida (va Task Scheduler loglarida) ko'rinmaydi, faqat lokal .env faylida turadi.

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$envFile = Join-Path $PSScriptRoot ".env"
if (-not (Test-Path $envFile)) {
    Write-Error "$envFile topilmadi. .env.example'dan nusxa oling va haqiqiy qiymatlarni kiriting."
    exit 1
}

Get-Content $envFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -eq "" -or $line.StartsWith("#")) { return }
    $idx = $line.IndexOf("=")
    if ($idx -lt 1) { return }
    $key = $line.Substring(0, $idx).Trim()
    $value = $line.Substring($idx + 1).Trim()
    if ($value -ne "") {
        [Environment]::SetEnvironmentVariable($key, $value, "Process")
    }
}

node "$PSScriptRoot\schedule-publish.mjs"
