# AUR Maintenance and Setup Guide

This document provides a comprehensive, step-by-step guide for setting up and maintaining the Arch User Repository (AUR) packages for CourseFin. CourseFin is distributed through two main AUR packages:

1.  **coursefin**: Builds from source (requires Go and Node.js)
2.  **coursefin-bin**: Uses the pre-built binary from GitHub Releases

## 1. Prerequisites

Before interacting with the AUR, ensure you have the necessary development tools installed on your Arch Linux system:

```bash
sudo pacman -S base-devel git namcap pacman-contrib
```

-   **base-devel**: Essential build tools (make, gcc, etc.)
-   **git**: Version control for cloning and pushing to AUR
-   **namcap**: A linter to verify the integrity and quality of PKGBUILDs and packages
-   **pacman-contrib**: Provides helpful utilities like `updpkgsums`

## 2. Create AUR Account

To maintain packages, you must have an AUR account.

1.  Visit the [AUR Registration page](https://aur.archlinux.org/register).
2.  Provide a username, email address, and real name.
3.  Verify your email address through the link sent to your inbox.
4.  Once logged in, go to your [account settings](https://aur.archlinux.org/account/) to configure your public SSH key.

## 3. SSH Key Setup

The AUR uses SSH for git authentication. You should create a dedicated key pair for AUR access.

### Generate the Key
```bash
ssh-keygen -t ed25519 -f ~/.ssh/aur -C "aur-$(whoami)"
```

### Configure SSH
Add the following block to your `~/.ssh/config` file to ensure the correct key is used for AUR connections:

```text
Host aur.archlinux.org
    IdentityFile ~/.ssh/aur
    User aur
```

### Register the Public Key
1.  Copy the content of your public key: `cat ~/.ssh/aur.pub`
2.  Paste it into the **SSH Public Key** field in your [AUR account settings](https://aur.archlinux.org/account/).

## 4. Initial Package Creation

If you are setting up the packages for the first time on a new machine, follow these steps.

### Clone the Repositories
The AUR uses specific URLs for each package:

```bash
# Clone source package
git clone ssh://aur@aur.archlinux.org/coursefin.git

# Clone binary package
git clone ssh://aur@aur.archlinux.org/coursefin-bin.git
```

### Initial Push
For each repository, copy the corresponding PKGBUILD from this repository's `packaging/aur/` directory:

1.  Copy `packaging/aur/coursefin/PKGBUILD` into the `coursefin` clone.
2.  Regenerate the `.SRCINFO` file (required by the AUR):
    ```bash
    makepkg --printsrcinfo > .SRCINFO
    ```
3.  Commit and push:
    ```bash
    git add PKGBUILD .SRCINFO
    git commit -m "Initial package"
    git push
    ```

Repeat these steps for the `coursefin-bin` package using its respective PKGBUILD.

## 5. Testing Locally

Always test your PKGBUILD changes locally before pushing to the AUR.

### Build and Install
Run this command in the directory containing the PKGBUILD:
```bash
makepkg -si
```
This builds the package and attempts to install it. It helps verify that dependencies are correct and the build process succeeds.

### Linting
Use `namcap` to check for common packaging errors:

```bash
# Check the PKGBUILD itself
namcap PKGBUILD

# Check the built package file
namcap *.pkg.tar.zst
```

## 6. Updating a Package

When a new version of CourseFin is released, the AUR packages must be updated.

1.  Edit the `pkgver` variable in the `PKGBUILD`.
2.  If the source URL or files changed, update the checksums:
    ```bash
    updpkgsums
    ```
3.  Regenerate the `.SRCINFO` file:
    ```bash
    makepkg --printsrcinfo > .SRCINFO
    ```
4.  Verify the build with `makepkg -si`.
5.  Commit the changes and push to the AUR.

## 7. CI Automation

CourseFin uses GitHub Actions to automatically update AUR packages whenever a new release is tagged.

### Required GitHub Secrets
The workflow requires the following secrets to be configured in the GitHub repository settings:

-   `AUR_SSH_PRIVATE_KEY`: The content of your `~/.ssh/aur` private key.
-   `AUR_USERNAME`: Your AUR account username.
-   `AUR_EMAIL`: The email address associated with your AUR account.

### Adding the Secret via CLI
You can easily add the private key secret using the GitHub CLI:

```bash
gh secret set AUR_SSH_PRIVATE_KEY < ~/.ssh/aur
```

The automation uses `KSXGitHub/github-actions-deploy-aur@v4.1.1` to handle the cloning, updating, and pushing process for both `coursefin` and `coursefin-bin`.

## 8. Troubleshooting

### SSH Authentication Failures
If `git push` fails with permission denied:
-   Verify that your public key is correctly uploaded to the AUR website.
-   Ensure your `~/.ssh/config` is correctly configured as shown in section 3.
-   Test the connection: `ssh -T aur@aur.archlinux.org`

### .SRCINFO Out of Sync
If the AUR website shows an older version than your PKGBUILD:
-   You likely forgot to update the `.SRCINFO` file.
-   Always run `makepkg --printsrcinfo > .SRCINFO` before every commit.

### Build Failures in CI
If the GitHub Action fails:
-   Verify the PKGBUILD works locally with `makepkg -si`.
-   Check if the version tags in `wails.json` match the expected format.
-   Ensure the download URLs in the PKGBUILD are still valid.
