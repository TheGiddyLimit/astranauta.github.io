## 5e Tools
[Go to 5etools](5etools.html)

[Join the 5etools Discord here!](https://discord.gg/v3AXzcW)

## Running 5etools Locally (Offline Copy)
There are several options for running a local/offline copy of 5etools, including:

**Beginner:** Use Firefox to open the files.

**Intermediate:** When using Chrome (or similar), a command-line switch is required to load some pages locally. On Windows, this can be accomplished by creating a Chrome shortcut and editing the properties of the shortcut to add `--allow-file-access-from-files` to the shortcut `Target`:

![Chrome tutorial](https://raw.githubusercontent.com/TheGiddyLimit/TheGiddyLimit.github.io/master/chrome-tutorial.png "Chrome tutorial")

Be sure to close any running Chrome instances (and kill any remaining Chrome processes as required) before opening the shortcut. A summary of the security implications can be found [here](https://superuser.com/a/873527).
 
**Advanced:** Host the project locally on a dev webserver, perhaps using [this](https://github.com/cortesi/devd).

## How to import 5etools beasts/spells/items into Roll20
1. Get Greasemonkey (Firefox) or Tampermonkey (Chrome).

2. Click [here](https://github.com/TheGiddyLimit/5etoolsR20/raw/master/5etoolsR20.user.js) and install the script.

3. Open the Roll20 game where you want the stuff imported.

4. Go to the gear icon and click on the things you want imported.

5. Let it run. The journal will start fill up with the stuff you selected. It's not too laggy but can take a long time depending on the amount of stuff you selected.

6. Bam. Done. If you are using the Shaped sheet, be sure to open up the NPC sheets and let them convert before using it.

You can convert stat blocks to JSON for importing via [this converter](converter.html).

## Dev Notes

### Style Guidelines
- Use tabs over spaces.

### JSON Cleaning
#### Trailing commas
To remove trailing commas in JSON:

Find: (.*?)(,)(:?\s*]|\s*})

Replace: $1$3

#### Character replacement:
- ’ should be replaced with '
- — should be replaced with \u2014
- “ and ” should be replaced with "

## License

This project is licensed under the terms of the MIT license.