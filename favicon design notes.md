## Favicon update - 1.115?
Website favicons have been subtly redone by jpcranford (aka ldsmadman), based on the original logo by Fantom and Cyanomouss. SVG design was completed within Illustrator, and final sizes generated with Sketch. All source files have been included in a ZIP file [here](), with the changes detailed below for the curious. <!-- TODO insert link to zip file of source docs into link holder above -->

- New color theme <!-- REVIEW: possibly to be used in v2.0 of the site? -->
- 5e Logo: The text has been resized within the logo to give more spacing around edge. Apple's "official" app design grid came in handy here.
- Web App Icon: The icon with the pirate hat has been replaced. It was cheeky, but definitely not the impression we want to give off. <!-- TODO: Delete the /icon folder, wherever it is -->
- Favicon: The blue has been changed to match the app icon. This has the added benefit of making it easier to see while in your browser's Dark Mode.
- New favicons created:
  - Apple Touch Icons, used by both desktop & mobile versions of Safari, Chrome, and many more
  - Android Chrome Homescreen Icon & Splash screen
  - Safari for macOS Pinned Tab logo and Touch Bar bookmark
<!-- QUESTION: Should I also make a iOS splash screen? The code does declare that it's a web app, and therefore doesn't open in a new Safari tab. -->

### Unified Color Theme
In rejiggering the icons, I put together a more cohesive color theme. It could also work for the site, if Giddy wants to do that, but for now I'm proud of it and want to show off.

![color theme]() <!-- TODO: combine this list into an image with swatches -->
- **Adventure Blue #006BC4** This is the color of the site's header in Day Mode, and so considered as the "official" color of the site. As such, it's the background color of the "app icon" design.
- **Gelatinous Cube #1998FF** More bright than Adventure
- **Barovian Midnight #004278** A beautiful darker shade of Adventure Blue.
- #AF415E - A beautiful red that fits well. Don't know where to use this just yet.

<!-- REVIEW: Remove task marks (last column of table) before final commit and pull request -->
<!-- TODO: Precomposed (circular?) app logo design -->
| Resolution | Design | Device/Browser | Generated and filed in folder? |
|-|-|-|-|
| 16x16 | favicon | Only used on Firefox nowadays. Most browsers use the 32px version. | <input type="checkbox" disabled> |
| 32x32 | favicon | Most frequently used size for tab and bookmark icons, and also search results. | <input type="checkbox" disabled> |
| 48x48 | favicon | ??? | <input type="checkbox" disabled> |
| 120x120 | app icon | Apple Touch Icon for iPhones with @2x displays (iPhone SE/6s/7/8/XR) | <input type="checkbox" disabled> |
| 128x128 | white logo | Windows 10 Start Menu tile, Small size (`browserconfig.xml` for declaration, and `msapplication-TileColor` in HTML for background color) | <input type="checkbox" disabled> |
| 152x152 | app icon | Apple Touch Icon for iPads & iPad minis | <input type="checkbox" disabled> |
| 167x167 | app icon | Apple Touch Icon for iPad Pros | <input type="checkbox" disabled> |
| 180x180 | app icon | Apple Touch Icon for iPhones with @3x displays (iPhone 6s Plus/7 Plus/8 Plus/X/XS/XS Max). Also used by desktop versions of Firefox and Safari for their bookmark and "desktop" icons | <input type="checkbox" disabled> |
| 192x192 | favicon | Chrome's Add to Desktop | <input type="checkbox" disabled> |
| 192x192 | app icon | Android Chrome's Add to Homescreen (see `manifest.webmanifest`) | <input type="checkbox" checked disabled> |
| 270x270 | white logo | Windows 10 Start Menu tile, Medium size (`browserconfig.xml` for declaration, and `msapplication-TileColor` in HTML for background color) | <input type="checkbox" disabled> |
| 512x512 | app icon | Android Chrome's splash screen (see `manifest.webmanifest`) | <input type="checkbox" checked disabled> |
| 558x270 | white logo | Windows 10 Start Menu tile, Wide size (`browserconfig.xml` for declaration, and `msapplication-TileColor` in HTML for background color) | <input type="checkbox" disabled> |
| 558x558 | white logo | Windows 10 Start Menu tile, Large size (`browserconfig.xml` for declaration, and `msapplication-TileColor` in HTML for background color) | <input type="checkbox" disabled> |
| SVG | white logo | macOS Safari Pinned Tab and Touch Bar bookmark | <input type="checkbox" disabled> |
| 1024x1024 | app icon | Chrome web app mode (see `manifest.webmanifest`) | <input type="checkbox" checked disabled> |

This is the code that should now be in every page's `<head>` section. Just in case, I've duplicated it here.
```html
<!-- TODO: Replace the version references with correct version as this favicon project gets closer to release. -->
<!-- Apple Touch Icons -->
<link rel="apple-touch-icon" sizes="120x120" href="apple-touch-icon-120x120.png?v=1.115">
<link rel="apple-touch-icon" sizes="152x152" href="apple-touch-icon-152x152.png?v=1.115">
<link rel="apple-touch-icon" sizes="167x167" href="apple-touch-icon-167x167.png?v=1.115">
<link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon-180x180.png?v=1.115">

<!-- Favicons -->
<link rel="icon" type="image/png" sizes="32x32" href="favicon-32x32.png?v=1.115">
<link rel="icon" type="image/png" sizes="16x16" href="favicon-16x16.png?v=1.115">
<!-- <link rel="shortcut icon" href="favicon.ico?v=1.115"> -->

<!-- Android Chrome  App Icons -->
<link rel="manifest" href="/manifest.webmanifest?v=1.115">


<!-- Windows Start Menu tiles -->
<meta name="msapplication-TileColor" content="#006bc4">

<!-- TODO Coast by Opera -->
<link rel="icon" href="$URL" sizes="228x228">

<!-- REVIEW What is this for? -->
<meta name="theme-color" content="#ffffff">

<!--  -->
```

#### Not Supported
The following otherwise commonly supported platforms/browsers have specifically *not* had icons rendered for them, mostly because the site doesn't work on them and/or they're older than HTML5. I've also included the dates they were released, to ease any panic that may happen:

  - IE 10 (2012) and below (i.e. `favicon.ico`)
  - Apple Touch Icons for pre-iOS 7, non-Retina sizes (Apple switched to Retina everything in 2014)
  - Windows 8 (2012) or below

### Warning: Don't use a favicon.ico!
ICO is a dated format, and nearly all browsers within use today support PNG favicons, according to [Can I Use…?](caniuse.com). In fact, some modern browsers will always prefer the ICO, even if there are better PNG options available.

### Designs & Resolutions
(table)

It should be noted that several browsers on both desktop and mobile platforms use the Apple Touch Icon for various functions. For specifics, see [this page](https://realfavicongenerator.net/favicon_compatibility) put together by the RealFaviconGenerator.

### Update to Repo
#### Files
| Complete? | Filename | Dimensions | Resolution (if >1x) | Usage |
|-|-|-|-|-|
| <input type="checkbox" checked disabled> | `favicon-16x16.png` | 16px × 16px |  | Used in everything from lists of bookmarks to the tab icons. |
| <input type="checkbox" checked disabled> | `favicon-32x32.png` | 32px × 32px | @2x | Same as above, but adjusted for high-density displays. AFAIK, this is currently only implemented in Safari on macOS. Shame. |
| <input type="checkbox" checked disabled> | `favicon-96x96.png` | 96px × 96px |  | GoogleTV icon |
| <input type="checkbox" checked disabled> | `favicon-128x128.png` | 128px × 128px |  | ??? |
| <input type="checkbox" checked disabled> | `favicon-196x196.png` | 196px × 196px |  | ??? |
|  | `apple-touch-icon-57x57.png` |  |  | *No longer listed as current on Apple's website.* |
|  | `apple-touch-icon-60x60.png` |  |  | *No longer listed as current on Apple's website.* |
|  | `apple-touch-icon-72x72.png` |  |  | *No longer listed as current on Apple's website.* |
|  | `apple-touch-icon-76x76.png` |  |  | *No longer listed as current on Apple's website.* |
|  | `apple-touch-icon-114x114.png` |  |  | *No longer listed as current on Apple's website.* |
| <input type="checkbox" disabled> | `apple-touch-icon-120x120.png` | 120px × 120px | @2x | Non-"Plus" iPhones (up to 8), iPhone XR, all iPads |
| <input type="checkbox" disabled> | `apple-touch-icon-152x152.png` | 152px × 152px | @2x | iPad, iPad mini |
| <input type="checkbox" disabled> | `apple-touch-icon-167x167.png` | 167px × 167px | @3x | iPad Pro |
| <input type="checkbox" disabled> | `apple-touch-icon-180x180.png` | 180px × 180px | @3x | All "Plus"-model iPhones, iPhone X/XS/XS Max. |
|  | `apple-touch-icon-1024x1024.png` |  |  | Fallback for Apple devices. If the device's preferred size isn't found, it'll use the next size up. This one pretty much future-proofs it. |
|  | `android-chrome-192x192.png` |  |  |  |
|  | `android-chrome-256x256.png` |  |  |  |
|  | `android-chrome-512x512.png` |  |  |  |
|  | `site.webmanifest` |  |  | Neat little JSON file to let Android Chrome know which icons to use. |
|  | (Safari pinned tab) |  |  |  |
| <input type="checkbox" disabled> | `mstile-70x70.png` | 128px × 128px |  | Windows 10 Start Menu tile, small size. <!-- COMBAK: Test these as PNG, use alternative if needed to keep file size under spec. --> |
| <input type="checkbox" disabled> | `mstile-150x150.png` | 270px × 270px |  | Windows 10 Start Menu tile, medium size. |
|  | `mstile-310x150.png` | 270px × 270px |  | Windows 10 Start Menu tile, wide size. |
|  | `mstile-310x310.png` | 558px × 558px |  | Windows 10 Start Menu tile, large size. |
| <input type="checkbox" checked disabled> |  |  |  |  |

# (WIP stuff)
[^2]: Official documentation for the Apple icons is located [here](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html#//apple_ref/doc/uid/TP40002051-CH3-SW6), and their style guidelines and recommendations for app icons can be found [here](https://developer.apple.com/design/human-interface-guidelines/ios/icons-and-images/app-icon/).

[^3]: Documentation for Safari's "pinned tab" icons (which are how Touch Bar bookmarks do their thing) is [here](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/pinnedTabs/pinnedTabs.html#//apple_ref/doc/uid/TP40002051-CH18-SW1)

[^4]: **Note: These "must be smaller than 200 KB in size and no larger than 1024x1024 pixels."** Documentation for Microsoft Edge/Windows 10's "Pinned Sites" feature can be found on Microsoft's website, including a task-based [walkthrough](https://docs.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/dev-guides/bg183312%28v=vs.85%29?redirectedfrom=MSDN), [style recommendations](http://msdn.microsoft.com/en-us/library/ie/dn455106%28v=vs.85%29.aspx), and a [metadata reference](https://docs.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/platform-apis/dn255024%28v=vs.85%29). If you didn't know that you could pin websites to Start Menu tiles, check out [this primer](https://www.lifewire.com/pin-web-page-to-windows-10-start-menu-4103663) to get started.

### Upgraded
- Apple's touch icon [documentation](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html#//apple_ref/doc/uid/TP40002051-CH3-SW6) was followed to the letter, and their app icon style [guidelines](https://developer.apple.com/design/human-interface-guidelines/ios/icons-and-images/app-icon/) were also consulted.
- The [FAQ page](https://realfavicongenerator.net/faq) over at RealFaviconGenerator.net was very helpful in locating the source documentation for so many of these browsers and operating systems.

### Improvements
  - _#006BC4_  #1DBDA1   #CBBB6B   #C18B45   #BD494E
  - _#006BC4_  #27B5B1   #B8AD78   #AE7562   #C8554A
  - _#006BC4_  #3CBCC2   #E3C18A   #E4966F  _#AF415E_
  - _#006BC4_  #42ADB8   #E1D7BF   #ECA682  _#AF415E_
  - _#006BC4_ _#AF415E_  #C5615B   #D4C5A1   #E1CA89
  - _#006BC4_ _#AF415E_  #DE7E3D   #D7AC65   #C7C549
  - _#006BC4_ _#AF415E_ _#004278_  #E9833A   #E6DA5C

Possible Color names:
  - Stormy night - a dark grey?
  - Dragon blue: a darker one, leaning towards electric
  - Slaad blue: a more vibrant one than "official". ![blue slaad](https://5e.tools/img/bestiary/MM/Blue%20Slaad.jpg?v=1.114.1)
  - Salamander blue: ![frost salamander](https://5e.tools/img/bestiary/MTF/Frost%20Salamander.jpg?v=1.114.1)
