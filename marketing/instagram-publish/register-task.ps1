# Windows Task Scheduler'ga "WeWatchInstagramPublish" vazifasini ro'yxatdan o'tkazadi —
# har 15 daqiqada run-schedule.ps1'ni ishga tushiradi (u .env'ni o'qib schedule-publish.mjs'ni chaqiradi).
#
# DIQQAT: bu skript ishga tushirilgach, .env to'ldirilgan kunlardan boshlab Instagram'ga
# HAQIQIY avtomatik post qila boshlaydi. Faqat .env to'ldirilgach va tasdiqlangandan
# keyin ishga tushiring — qo'lda, shu faylni terminalda chaqirib:
#   powershell -ExecutionPolicy Bypass -File .\register-task.ps1

$ErrorActionPreference = "Stop"
$taskName = "WeWatchInstagramPublish"
$scriptPath = Join-Path $PSScriptRoot "run-schedule.ps1"

$action = New-ScheduledTaskAction -Execute "powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`""
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 15) -RepetitionDuration ([TimeSpan]::MaxValue)
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopOnIdleEnd

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description "WeWatch 30-kunlik Instagram jadvalini har 15 daqiqada tekshiradi va navbatdagi postni chiqaradi." -Force

Write-Host "Vazifa ro'yxatdan o'tdi: $taskName (har 15 daqiqada). To'xtatish uchun: Unregister-ScheduledTask -TaskName '$taskName' -Confirm:`$false"
