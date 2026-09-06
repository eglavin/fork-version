#!/usr/bin/env pwsh

param (
	[Parameter(Mandatory)] [string] $Path,
	[string] $Mode = "local",
	[switch] $Dry
)

$CurrentDirectory = Get-Location
$ForkVersionPath = Join-Path -Path $PSScriptRoot -ChildPath ".." -Resolve

function Test-IsForkVersionPath {
	param (
		[string]$Source,
		[string]$SelectedPath
	)

	if ($Source -eq $SelectedPath) {
		return $true
	}

	$SourceFull = [System.IO.Path]::GetFullPath($Source.TrimEnd('\', '/'))
	$SelectedFull = [System.IO.Path]::GetFullPath($SelectedPath)

	# Ensure trailing separator on parent so "C:\Foo" doesn't match "C:\FooBar"
	$SelectedWithSep = $SourceFull.TrimEnd('\', '/') + [System.IO.Path]::DirectorySeparatorChar

	return $SelectedFull.StartsWith($SelectedWithSep, [System.StringComparison]::OrdinalIgnoreCase)
}

if (Test-IsForkVersionPath -Source $ForkVersionPath -SelectedPath $Path) {
	Write-Error "This script shouldn't run within the fork-version repo."
	exit 1
}

$argv = [System.Collections.Generic.List[string]]@(
	"-G", "{test,package,jsr}.json",
	"--release-message-suffix", "[skip ci]",
	"--changelog-all",
	"--debug"
)

if ($Dry) {
	[void]$argv.Add("--dry-run")
}

try {
	Set-Location $Path

	switch ($Mode) {
		"npx" {
			Write-Host "Using fork-version from npx..." -ForegroundColor Green

			& npx fork-version @argv
		}

		"pnpm" {
			Write-Host "Using installed fork-version..." -ForegroundColor Green

			& pnpm fork-version @argv
		}

		"local" {
			$BuildPath = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath((Join-Path -Path $ForkVersionPath -ChildPath "dist","cli.js"))

			if (-not (Test-Path $BuildPath)) {
				Write-Host "Build output not found, Running build now." -ForegroundColor Red
				& powershell "Set-Location $ForkVersionPath; pnpm build;"
			}

			Write-Host "Using built fork-version..." -ForegroundColor Green

			& node $BuildPath @argv
		}
	}
}
finally {
	Set-Location $CurrentDirectory
}

