Favicon redesigned by jpcranford (aka ldsmadman), based on the original design(s) by Fantom and Cyanomouss

Filename                         | Resolution      | Design Size   | HTML `<head>` Declaration | Usage
---------------------------------|-----------------|---------------|---------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
~~favicon.ico~~                  |                 |               |                           | ~~For any poor saps still browsing with IE.~~ The site doesn't even work in IE, so not really needed.
`favicon-16x16.png`              | 16px × 16px     | 16pt[^1]      |                           | Used in everything from lists of bookmarks to the icons in tab labels.
`favicon-32x32.png`              | 32px × 32px     | 16pt @2x      |                           | The above, but adjusted for high-density displays, such as Apple's Retina devices. AFAIK, this is currently only implemented in Safari on macOS.
`apple-touch-icon-120x120.png`   | 120px × 120px   | 60pt @2x      |                           | Non-"Plus" iPhones (up to 8), iPhone XR, all iPads[^2]
`apple-touch-icon-152x152.png`   | 152px × 152px   | 76pt @2x      |                           | iPad, iPad mini[^2]
`apple-touch-icon-167x167.png`   | 167px × 167px   | 83.5pt @2x    |                           | iPad Pro[^2]
`apple-touch-icon-180x180.png`   | 180px × 180px   | 60pt @3x      |                           | All "Plus"-model iPhones, iPhone X/XS/XS Max.[^2]
`apple-touch-icon-1024x1024.png` | 1024px × 1024px | 1024pt        |                           | Just in case something else fails, this is a high-res version that they can all use. <!-- QUESTION: Is this one really necessary? -->
(an SVG file)                    | ???             | ???           |                           | Safari Pinned Tab & Touch Bar[^3]
`mstile-70x70.png`               | 128px × 128px   | 70px × 70px   |                           | Windows 10 Start Menu tile. Defines the image to use as the small tile for the pinned site.[^4] <!-- COMBAK: Test these as PNG, use alternative if needed to keep file size under spec. -->
`mstile-150x150.png`             | 270px × 270px   | 150px × 150px |                           | Windows 10 Start Menu tile. Defines the image to use as the medium tile for the pinned site.[^4]
`mstile-310x150.png`             | 270px × 270px   | 310px × 150px |                           | Windows 10 Start Menu tile. Defines the image to use as the wide tile for the pinned site.[^4]
`mstile-310x310.png`             | 558px × 558px   | 310px × 310px |                           | Windows 10 Start Menu tile. Defines the image to use as the large tile for the pinned site.[^4]
                                 |                 |               |                           | Android (Chrome M47+?) icon

<!-- TODO: Add another column listing the HTML declaration to use. -->

[^1]: You may ask, why is this? [Tradition](https://youtu.be/kDtabTufxao)!

[^2]: Official documentation for the Apple icons is located [here](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html#//apple_ref/doc/uid/TP40002051-CH3-SW6), and their style guidelines and recommendations for app icons can be found [here](https://developer.apple.com/design/human-interface-guidelines/ios/icons-and-images/app-icon/).

[^3]: Documentation for Safari's "pinned tab" icons (which are how Touch Bar bookmarks do their thing) is [here](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/pinnedTabs/pinnedTabs.html#//apple_ref/doc/uid/TP40002051-CH18-SW1)

[^4]: **Note: These "must be smaller than 200 KB in size and no larger than 1024x1024 pixels."** Documentation for Microsoft Edge/Windows 10's "Pinned Sites" feature can be found on Microsoft's website, including a task-based [walkthrough](https://docs.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/dev-guides/bg183312%28v=vs.85%29?redirectedfrom=MSDN), [style recommendations](http://msdn.microsoft.com/en-us/library/ie/dn455106%28v=vs.85%29.aspx), and a [metadata reference](https://docs.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/platform-apis/dn255024%28v=vs.85%29). If you didn't know that you could pin websites to Start Menu tiles, check out [this primer](https://www.lifewire.com/pin-web-page-to-windows-10-start-menu-4103663) to get started.

### Upgraded
<!-- REVIEW: Remove task marks before final commit pre-pull-request -->
- Apple's touch icon [documentation](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html#//apple_ref/doc/uid/TP40002051-CH3-SW6) was followed to the letter, and their app icon style [guidelines](https://developer.apple.com/design/human-interface-guidelines/ios/icons-and-images/app-icon/) were also consulted.
- The [FAQ page](https://realfavicongenerator.net/faq) over at RealFaviconGenerator.net was very helpful in locating the source documentation for so many of these browsers and operating systems.

### Improvements
<!-- NB: Until marked as "completed," these are just ideas. -->
- [ ] "5e" part of logo resized to give more spacing around edge
- [x] The touch icon's background was #2d69be. Don't know where they got that color from, but it's now been updated to match the website's header (#006bc4). It's a more vibrant shade of blue, althought if you have a cheap monitor (one doesn't support 100% of the sRGB gamut) you might not be able to tell. Good thing I've got Apple devices.
- [ ] favicon's stroke (as far as I've been able to tell, the PSD file didn't have a color profile assigned to it) is #25325f. <!-- QUESTION: Is this even anywhere on the site? --> Possible alternatives:
  - #23527c - Day mode, text link hover
  - #4a6898 - Day mode PHB source
  - #337ab7 - Night mode PHB source
  - #48637a - Filter view- positive source highlight
  - $rgb-active-blue--dark: #2a6496
