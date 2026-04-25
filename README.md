
# TypeScript Sample Template Program for Battlefield 6 Rule Editor

[※ このリポジトリの日本語での説明はこちらです。](./README-JP.md)

This repository is designed to make it easier to write Battlefield (BF) Rule Editor scripts in TypeScript.

It provides the following features:


* When you push to GitHub, ESLint automatically checks your code syntax.
* Running `npm run build` combines multiple .ts files into a single .ts file.
  * The BF Portal Rule Editor only accepts a single TypeScript file.
* `bfportal-vitest-mock` and `vitest` are already installed, so you can easily use unit tests.

## Installation

0. Install Node.js.
  If you are new to JavaScript, it is recommended to download the .msi installer for the Windows x64 architecture from the following link and follow the installation steps:
  https://nodejs.org/en/download
1. Download this repository.
2. Place the PortalSDK/code folder from the official Battlefield 6 SDK into the code directory of this project.
3. Run the command npm install.

## Usage

1. Write your program in the mods folder.
2. After you finish coding, run the command npm run build.
3. Upload `dist/Script.ts` and `dist/String.json` to the BF Portal Rule Editor.

### Setting Up Strings

Add the strings you want to include in `dist/String.json`.

### How to run the tests

This project uses the `bfportal-vitest-mock` package. For how to install and use it, please refer to the section below.

https://github.com/link1345/bfportal-vitest-mock