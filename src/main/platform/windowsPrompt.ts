import { execFileSync } from 'child_process'

/**
 * Electron's `dialog` module has no text-input dialog, which is what
 * window.prompt() needs (several ED tool sites use it for "name this build"
 * style saves). This shells out to a tiny WinForms dialog via PowerShell --
 * message/defaultValue are passed as env vars rather than interpolated into
 * the script text so untrusted page content can't break out into the script.
 * -WindowStyle Hidden hides the PowerShell console host; the Form itself
 * still shows (and is set TopMost so it appears above the app window).
 *
 * execFileSync blocks the main process until the dialog is dismissed, same
 * as dialog.showMessageBoxSync already does for alert/confirm -- expected
 * for a synchronous JS dialog.
 */
export function showNativePrompt(message: string, defaultValue: string): string | null {
  const script = `
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$form = New-Object System.Windows.Forms.Form
$form.Text = 'ED Unified'
$form.StartPosition = 'CenterScreen'
$form.ClientSize = New-Object System.Drawing.Size(420, 130)
$form.TopMost = $true
$form.FormBorderStyle = 'FixedDialog'
$form.MaximizeBox = $false
$form.MinimizeBox = $false

$label = New-Object System.Windows.Forms.Label
$label.SetBounds(12, 12, 396, 40)
$label.Text = $env:ETB_PROMPT_MESSAGE
$form.Controls.Add($label)

$textbox = New-Object System.Windows.Forms.TextBox
$textbox.SetBounds(12, 56, 396, 24)
$textbox.Text = $env:ETB_PROMPT_DEFAULT
$form.Controls.Add($textbox)

$okButton = New-Object System.Windows.Forms.Button
$okButton.Text = 'OK'
$okButton.SetBounds(238, 92, 80, 28)
$okButton.DialogResult = [System.Windows.Forms.DialogResult]::OK
$form.Controls.Add($okButton)
$form.AcceptButton = $okButton

$cancelButton = New-Object System.Windows.Forms.Button
$cancelButton.Text = 'Cancel'
$cancelButton.SetBounds(328, 92, 80, 28)
$cancelButton.DialogResult = [System.Windows.Forms.DialogResult]::Cancel
$form.Controls.Add($cancelButton)
$form.CancelButton = $cancelButton

$form.Add_Shown({ $textbox.Focus(); $textbox.SelectAll() })
$result = $form.ShowDialog()
if ($result -eq [System.Windows.Forms.DialogResult]::OK) {
  [Console]::Out.Write($textbox.Text)
  exit 0
} else {
  exit 1
}
`

  try {
    return execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Sta', '-WindowStyle', 'Hidden', '-Command', script], {
      encoding: 'utf8',
      env: { ...process.env, ETB_PROMPT_MESSAGE: message, ETB_PROMPT_DEFAULT: defaultValue }
    })
  } catch {
    return null
  }
}
