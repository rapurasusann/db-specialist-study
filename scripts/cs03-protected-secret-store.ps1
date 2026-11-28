# Dot-source only. No provider calls or plaintext file writes.
function Save-Cs03ProtectedSecret {
    param([Parameter(Mandatory=$true)][Security.SecureString]$Secret,[Parameter(Mandatory=$true)][string]$Path)
    $ErrorActionPreference = 'Stop'
    $cipher = ConvertFrom-SecureString -SecureString $Secret
    $bytes = [Text.Encoding]::UTF8.GetBytes($cipher)
    $stream = [IO.File]::Open($Path,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None)
    try { $stream.Write($bytes,0,$bytes.Length); $stream.Flush($true) } finally { $stream.Dispose() }
}
function Read-Cs03ProtectedSecret {
    param([Parameter(Mandatory=$true)][string]$Path)
    $ErrorActionPreference = 'Stop'
    ConvertTo-SecureString -String ([IO.File]::ReadAllText($Path))
}

# Create a dedicated directory with a protected ACL before storing any secret.
function New-Cs03ProtectedStore {
    $ErrorActionPreference = 'Stop'
    $root = [Environment]::GetFolderPath('LocalApplicationData')
    if ([string]::IsNullOrWhiteSpace($root)) { throw 'LOCAL_APPDATA_UNAVAILABLE' }
    $path = Join-Path $root ('CS03-staging-' + [Guid]::NewGuid().ToString('N'))
    $sid = [Security.Principal.WindowsIdentity]::GetCurrent().User
    $acl = New-Object Security.AccessControl.DirectorySecurity
    $acl.SetAccessRuleProtection($true,$false)
    $acl.SetOwner($sid)
    $rule = New-Object Security.AccessControl.FileSystemAccessRule($sid,'FullControl','ContainerInherit,ObjectInherit','None','Allow')
    $acl.AddAccessRule($rule)
    [void][IO.Directory]::CreateDirectory($path,$acl)
    return $path
}
# Cleanup only after caller has independently verified both registrations.
function Remove-Cs03ProtectedSecret {
    param([Parameter(Mandatory=$true)][string]$Path,[switch]$RegistrationVerified)
    $ErrorActionPreference = 'Stop'
    if (!$RegistrationVerified) { throw 'REGISTRATION_NOT_VERIFIED' }
    $root = [Environment]::GetFolderPath('LocalApplicationData')
    $full = [IO.Path]::GetFullPath($Path)
    $parent = [IO.Directory]::GetParent($full)
    if ($parent.Parent.FullName -ne $root -or $parent.Name -notmatch '^CS03-staging-[a-f0-9]{32}$') { throw 'INVALID_STORE_PATH' }
    if ($parent.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'REPARSE_POINT' }
    $item = Get-Item -LiteralPath $full -Force
    if ($item.PSIsContainer -or ($item.Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw 'INVALID_SECRET_FILE' }
    Remove-Item -LiteralPath $full -Force
}
