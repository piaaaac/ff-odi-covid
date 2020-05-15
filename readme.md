Key Workers minisite
====================

Stories of migrants contributing to the COVID-19 response and saving lives across the globe

## To do list

- [BUG] Error if an area has no stories
- id=about { max-height: 500px;

## About the project

[ODI](https/odi.org) is collecting data and stories from across the world on migrants contributing to COVDI19 response, in healthcare and beyond. The updated dataset is [publicly available](https://docs.google.com/spreadsheets/d/1yrhvW80BzVU7-3bsTY7l8PDSYB9Q4XztHHLQ8Oy69NY/edit?ts=5e9572e8#gid=0).

ODI: Marta Foresti, Amy Leach, Rob Safar  
Design: Federica Fragapane, Alex Piacentini  
Development: Alex Piacentini


## Libraries used

- P5.js 1.0.0
- SVG.js 3.0
- lodash 4.17.15
- jQuery 3.4.1
- momentjs
- handlebars.js 4.7.6


## Content updates

The `content` folder stores all the versions of the content, each version in a subfolder.
The folder of the current version is referenced at the top of `index.js` and contains:

- `data.json`
- `maps-areas` folder
	
	One svg for each area (`north-america.svg`, `latin-america.svg`, `europe.svg`, `africa.svg`, `asia-oceania.svg`)

- `maps-stories` folder
	
	One svg file for each story (eg: `story-lorem-ipsum.svg`, `story-blah-blah.svg`, ...)

## Content versions

- vX.X.1, initial data
- vX.X.2, 24/04/20
- vX.X.3, 01/05/20 (folder v2)
- vX.X.4, 07/05/20 (folder v3)
- vX.X.5, 14/05/20
