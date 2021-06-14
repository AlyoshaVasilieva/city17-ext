# This should be an NPM script, but you think I know how NPM works?
# This is a script to set the secrets in the source code so I don't have to worry about billing.
# It's basically cat | sed > output
# Plus copying the other files, in a very verbose manner.
$ErrorActionPreference="Stop"
npm install
& "$PSScriptRoot\build_set_env_vars.ps1"
New-Item -Name src_proc\ts -ItemType directory -Force
New-Item -Name src_proc\css -ItemType directory -Force
New-Item -Name src_proc\images -ItemType directory -Force
(Get-Content .\src\ts\background.ts -Raw) -creplace 'FUNCTION_URL_BASE', $Env:FUNCTION_URL_BASE | Set-Content .\src_proc\ts\background.ts
(Get-Content .\src\manifest.json -Raw) -creplace 'FUNCTION_PERM_REGEX', $Env:FUNCTION_PERM_REGEX | Set-Content .\src_proc\manifest.json
Copy-Item .\src\ts\content.ts .\src_proc\ts\content.ts
Copy-Item .\src\css\* .\src_proc\css\
Copy-Item .\src\images\* .\src_proc\images\
npm run build
cmd /c pause # powershell's pause sucks