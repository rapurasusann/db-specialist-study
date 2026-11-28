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
