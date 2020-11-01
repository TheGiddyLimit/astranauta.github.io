## Favicon update

#### Now Supported… and not
- [x] iOS/iPadOS: Apple Touch Icons
- [ ] Safari for macOS: Pinned Tab and Touch Bar icons (shiny!)
- [ ] Android Chrome: Home Screen logo

#### Not Supported
The following platforms/browsers have not had icons rendered for them, mostly because the site doesn't work on them and/or they're older than HTML5. I've also included the dates they were released, to ease any panic that may happen:

  - IE 10 (2012) and below
  - Apple Touch Icons for pre-iOS 7, non-Retina sizes (Apple switched to Retina everything in 2014)
  - Windows 8 (2012) or below

### Unified Color Theme
In rejiggering the icons, I put together a more cohesive color theme. It could also work for the site, if Giddy wants to do that, but for now I'm proud of it and want to show off.

![color theme]()
<!-- TODO: combine this list into an image with swatches -->
- **Adventure #006BC4** This is the color of the site's header in Day Mode, and so considered as the "official" color of the site. As such, it's the background color of the "app icon" design.
- **Slaad Blue: #008DFF** More bright than Adventure
- **Barovian Night #004278** A beautiful darker shade of 5eTools.

### Warning: Don't use a favicon.ico!
ICO is a dated format, and nearly all browsers within use today support PNG favicons, according to [Can I Use…?](caniuse.com). In fact, some modern browsers will always prefer the ICO, even if there are better PNG options available.

### App Logo
- Symbol has been resized within the logo to give more spacing around edge. Apple's app design grid (the one with the concentric circles) came in handy here.

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

### `<head>` code
This is the code that should now be in every page's `<head>` section.
```html
<!-- Favicon -->

<!-- iOS App Icons -->
<link rel="apple-touch-icon" sizes="120x120" href="apple-touch-icon-120x120.png">
<link rel="apple-touch-icon" sizes="152x152" href="apple-touch-icon-152x152.png">
<link rel="apple-touch-icon" sizes="167x167" href="apple-touch-icon-167x167.png">
<link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon-180x180.png">

<!-- Android Chrome  App Icons -->
<link rel="manifest" href="/site.webmanifest">

<link rel="icon" type="image/png" sizes="32x32" href="favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="favicon-16x16.png">

<!-- macOS Safari Pinned Tab and Touch Bar -->
<link rel="mask-icon" href="/safari-pinned-tab.svg" color="#006bc4">

<!-- TODO: Unknown??? -->
<meta name="msapplication-TileColor" content="#006bc4">
<meta name="theme-color" content="#ffffff">
<!--  -->
```

# (WIP stuff)
[^2]: Official documentation for the Apple icons is located [here](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html#//apple_ref/doc/uid/TP40002051-CH3-SW6), and their style guidelines and recommendations for app icons can be found [here](https://developer.apple.com/design/human-interface-guidelines/ios/icons-and-images/app-icon/).

[^3]: Documentation for Safari's "pinned tab" icons (which are how Touch Bar bookmarks do their thing) is [here](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/pinnedTabs/pinnedTabs.html#//apple_ref/doc/uid/TP40002051-CH18-SW1)

[^4]: **Note: These "must be smaller than 200 KB in size and no larger than 1024x1024 pixels."** Documentation for Microsoft Edge/Windows 10's "Pinned Sites" feature can be found on Microsoft's website, including a task-based [walkthrough](https://docs.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/dev-guides/bg183312%28v=vs.85%29?redirectedfrom=MSDN), [style recommendations](http://msdn.microsoft.com/en-us/library/ie/dn455106%28v=vs.85%29.aspx), and a [metadata reference](https://docs.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/platform-apis/dn255024%28v=vs.85%29). If you didn't know that you could pin websites to Start Menu tiles, check out [this primer](https://www.lifewire.com/pin-web-page-to-windows-10-start-menu-4103663) to get started.

### Upgraded
<!-- REVIEW: Remove task marks before final commit pre-pull-request -->
- Apple's touch icon [documentation](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html#//apple_ref/doc/uid/TP40002051-CH3-SW6) was followed to the letter, and their app icon style [guidelines](https://developer.apple.com/design/human-interface-guidelines/ios/icons-and-images/app-icon/) were also consulted.
- The [FAQ page](https://realfavicongenerator.net/faq) over at RealFaviconGenerator.net was very helpful in locating the source documentation for so many of these browsers and operating systems.

### Improvements
<!-- NB: Until marked as "completed," these are just ideas. -->
- [x] The app icon's background was #2d69be. Don't know where they got that color from, but it's now been updated to match the website's header #006bc4, the closest thing we've got to "official" blue. I think I'll name it **Adventure blue**.
- [x] favicon's stroke color (as far as I've been able to tell) was #25325f. That's been changed to #004278, a beautiful darker shade that could very well be used as a "night mode" alternate for our blue.
  - #008dff - lighter shade, same saturation
  - #1998ff - beautiful lighter shade, leaning slightly towards white
  - **Complementary colors:** #006BC4, #1DBDA1, #CBBB6B, #C18B45, #BD494E
  - Color set 2 (less saturated): #006BC4, #27B5B1, #B8AD78, #AE7562, #C8554A
  - #AF415E - beautiful r*d. that fits well with the color

Possible Color names:
  - Stormy night - a dark grey?
  - Dragon blue: a darker one, leaning towards electric
  - Slaad blue: a more vibrant one than "official". ![blue slaad](https://5e.tools/img/bestiary/MM/Blue%20Slaad.jpg?v=1.114.1)
  - Salamander blue: ![frost salamander](https://5e.tools/img/bestiary/MTF/Frost%20Salamander.jpg?v=1.114.1)

  | Complete? | Filename      | Resolution | Usage                                           |
  |-----------|---------------|------------|-------------------------------------------------|
  | <input type="checkbox" disabled> aadf     | `favicon.ico` | multiple   | Classic .ico file, mostly for use as a fallback |
  | <input type="checkbox" checked disabled>          |               |            |                                                 |
  |           |               |            |                                                 |
