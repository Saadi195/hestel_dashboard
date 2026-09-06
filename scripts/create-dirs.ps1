$features = @('residents','rooms','beds','check-in','check-out','notices','payments','deposits','fines','expenses','complaints','visitors','employees','reports','activity-logs')
$subdirs = @('components','actions','services','repositories','schemas','types')

foreach ($feature in $features) {
    foreach ($sub in $subdirs) {
        $path = "d:\Hostel Dashboard\features\$feature\$sub"
        New-Item -ItemType Directory -Force -Path $path | Out-Null
        Set-Content -Path "$path\.gitkeep" -Value ""
    }
}

$infraDirs = @(
    "d:\Hostel Dashboard\infrastructure\repositories",
    "d:\Hostel Dashboard\infrastructure\services",
    "d:\Hostel Dashboard\infrastructure\external",
    "d:\Hostel Dashboard\supabase\migrations",
    "d:\Hostel Dashboard\tests\unit",
    "d:\Hostel Dashboard\tests\integration",
    "d:\Hostel Dashboard\tests\e2e\auth",
    "d:\Hostel Dashboard\tests\e2e\residents",
    "d:\Hostel Dashboard\tests\e2e\rooms",
    "d:\Hostel Dashboard\tests\e2e\payments",
    "d:\Hostel Dashboard\tests\e2e\checkout",
    "d:\Hostel Dashboard\tests\e2e\.auth",
    "d:\Hostel Dashboard\docs",
    "d:\Hostel Dashboard\public"
)

foreach ($dir in $infraDirs) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
    Set-Content -Path "$dir\.gitkeep" -Value ""
}

Write-Host "All directories created successfully"
