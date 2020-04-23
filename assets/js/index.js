/* -------------------------------------

To do

- consider css transitions and transformations instead of svg.js
  - can't use to position, use svg.js instead 
    (ie/edge support issues https://css-tricks.com/transforms-on-svg-elements/)

- mobile
  - different tree positions
  - home  - long svg
    mid   - shorter svg, ui markup appears
    story - no svg, ui markup appears


SELECT A TREE
- #header: change class (- home, + full)
- #header: add area class (after removing all area classes)
- move tree and hide others
- make sure content below is hidden

SELECT A STORY
- if tree is not selected, do it
- show story content

------------------------------------- */

var cnt = document.getElementById("container");
var animms = 600;
var animmsSelectTree = 1200;
var templates = {};
var releaseFolder;
var trees;
var timeline;

var state = {
  loadingData: true,
  flatData: null,
  data: {},
  storiesMap: {},
  p5setupDone: false,
  p5Finished: false,
  w: cnt.offsetWidth,
  h: cnt.offsetHeight,
  treePositions: {},
  selectedTree: null,
  firstDate: moment(),
  lastDate: moment("2000-01-01"),
  isMobile: isMobile(),
  currentPage: {},
};

// releaseFolder = "content/200418-dev";
releaseFolder = "content/200421-alpha";

loadData(releaseFolder +"/data.json", function (fullTreeData) {
  state.data = fullTreeData;
  console.log("state.data", state.data);
  state.loadingData = false;
});

var areaNames = {
  "north-america":  "North America",
  "latin-america":  "Latin America",
  "europe":         "Europe",
  "africa":         "Africa",
  "asia-oceania":   "Asia & Oceania",
};


// ----------------------------------------------
// jQuery start
// ----------------------------------------------

// $(document).ready(function() {
// });

// ----------------------------------------------
// SVG.js
// ----------------------------------------------

var svg = SVG().addTo('#container')
  .size(state.w, state.h)
  .addClass("artboard");

var svgStyles = {
  "normal": {
    "stroke": "#f06",
    "stroke-width": 1,
    "fill": "none",
    "stroke-linecap": "round"
  },
  "friut": {
    "fill": "#E75F52",
    "stroke": "#E6E7E7",
    "stroke-width": 1,
  },
  "friut-selected": {
    "fill": "none",
    "stroke": "#E75F52",
    "stroke-width": 1,
    "opacity": 0,
  },
  "hover": {
    "stroke": "#000",
    "stroke-width": 2,
    "fill-opacity": 0,
  },
  "transp-sensi": {
    "stroke": "#000",
    "stroke-opacity": 0,
    "stroke-width": 10,
    "fill": "none",
  },
};

var csize = 5;
var csize2 = 12;

function svgBranchCurved (mx,my, x1,y1, x2,y2, x,y, props) {
  var g = svg.group()
    .addClass("branch-g").addClass(props.class)
    .attr("id", props.id)
    .data(props);
  var additionalStyle = {
    "stroke-width": (props.depth < 3) ? 2 : (props.depth == 3) ? 0.7 : 0.5,
    "stroke": (props.depth <= 3) ? "#000" : "#E75F52",
    // "stroke-dasharray": (props.dimension != "level") ? "" 
    //   : (props.value == "local") ? "7 5"
    //   : (props.value == "individual") ? "0 5"
    //   : "",
  };
  var pathString = "M"+mx+" "+my+" C"+x1+" "+y1+" "+x2+" "+y2+" "+x+" "+y;
  g.path(pathString)
    .attr(svgStyles.normal)
    .attr(additionalStyle)
    .addClass(props.class)
    .addClass("branch-path");
  if (props.dimension == "story") {
    g.path(pathString).attr(svgStyles["transp-sensi"]);
    g.circle(csize).attr(svgStyles.friut).attr({ cx: x, cy: y });
    g.circle(csize).attr(svgStyles["transp-sensi"]).attr({ cx: x, cy: y });
    g.circle(csize2).attr(svgStyles["friut-selected"]).addClass("selection-circle").attr({ cx: x, cy: y });
  }
  return g;
}

/*
storyTitle("Wallonia translates COVID-19 information for migrants");
storyTitle("Belgium allows asylum seekers to work");
storyTitle("Germany strives to enlist migrant medics");
storyTitle("German region calls for foreign doctors");
storyTitle("France allows refugees with non-EU medical certifications to practice");
storyTitle("French region recruits refugees as seasonal workers");
storyTitle("Ireland calls for retired doctors living abroad to return ");
storyTitle("Ireland offers financial and healthcare support for migrants");
storyTitle("Village near Rome supported by migrant cooperative ");
storyTitle("Lithuania suspends deportations ");
storyTitle("Asylum seekers in Dutch village disinfect grocery carts to protect population ");
storyTitle("Norway sends healthcare staff to Italy");
*/

function storyTitle (title) {
  
  var maxW = 300;

  var lines = [];
  var chars = title.split("");
  
  while (chars.length > 0) {
    var lastSpaceIndex = 0;
    for (var i = 0; i < chars.length; i++) {
      if (chars[i] == " ") {
        lastSpaceIndex = i;
      }
      if (i >= chars.length-1) {
        lines.push(chars.splice(0).join(""));
      }
      if (i >= maxCharsPerLine) {
        lines.push(chars.splice(0, lastSpaceIndex).join(""));
        chars = chars.join("").trim().split("");
      }
    }
  }
  console.log(lines);


  // var maxCharsPerLine = 30;
  // var lines = [];
  // var chars = title.split("");
  
  // while (chars.length > 0) {
  //   var lastSpaceIndex = 0;
  //   for (var i = 0; i < chars.length; i++) {
  //     if (chars[i] == " ") {
  //       lastSpaceIndex = i;
  //     }
  //     if (i >= chars.length-1) {
  //       lines.push(chars.splice(0).join(""));
  //     }
  //     if (i >= maxCharsPerLine) {
  //       lines.push(chars.splice(0, lastSpaceIndex).join(""));
  //       chars = chars.join("").trim().split("");
  //     }
  //   }
  // }
  // console.log(lines);

  // var t = svg.text().addClass("story-title");

}


function tooltipOff () {
  $(".tooltip").remove();
}
function tooltip (x, y, text) {
  var m = 5;
  var g = svg.group().addClass("tooltip");
  var t = g.text(text)
    .x(x).y(y)
    .font({ "anchor": "middle", "fill": "white" })
    .addClass("font-small");
  var tbb = t.bbox();
  g.rect(tbb.w + m*2 + 6, tbb.h + m*2)
    .attr({ "fill": "black" })
    .cx(x).y(y + 3 - m)
    .radius(5)
    .back();
  var gbb = g.bbox();
  if (gbb.x < 10) {
    g.x(10);
  }
  if (gbb.x + gbb.w + 10 > state.w) {
    g.x(state.w - gbb.w - 10);
  }
}


// ----------------------------------------------
// P5
// ----------------------------------------------

trees = {


  "europe": null,
  "north-america": null,
  "asia-oceania": null,
  "latin-america": null,
  "africa": null,

  // "north-america": null,
  // "south-america": null,
  // "europe": null,
  // "africa": null,
  // "asia": null,
  // "oceania": null,
};
// var tf = new Transformer();

// PARAMS
// var len0 = 70;
var lenW = state.w * 0.05;
var lenH = state.h * 0.14;
var len0 = Math.min(lenW, lenH);
if (state.isMobile) {
  len0 = state.w * 0.06;
}

function setup() {
  var cvs = createCanvas(100, 100);
  cvs.parent("container");
  resizeCanvas(state.w, state.h);
}

function setup2 () {
  function randomAngle (max) {
    return map(random(1), 0,1, -max, max);
  } 
  Object.keys(trees).forEach(function(key, i) {
    var data = _.find(state.data.children, function (e) { return e.props.id == key; });
    var totalTreeStories = countChildren(data);
    data.props.totalTreeStories = totalTreeStories;
    var b = new Branch (data.children, null, len0*0.5, randomAngle(PI/30), data.props);
    var t = new Tree (createVector(0,0), b);
    trees[key] = t;
  });
  state.p5setupDone = true; 
}

function draw() {
  console.log("loop n "+ frameCount);
  if (state.loadingData) {
    return;
  }
  if (!state.p5setupDone) {
    setup2();
  }

  var treesNotDrawn = Object.keys(trees)
    .map(function(k) { return trees[k]; })
    .filter(function(t) { return t.drawn === false; })
    .length;

  if (treesNotDrawn > 0) {
    Object.keys(trees).forEach(function(key, i) {
      trees[key].display();
    });
  } else {
    noLoop();
    addListeners();
    initialize();
    registerTemplates();
    setTimeout(function () { remove(); }, 200); // remove p5 sketch and canvas
  }

}
function registerTemplates () {
  templates.storyPreviews = Handlebars.compile($("#template-story-previews").html());
  templates.areaStats     = Handlebars.compile($("#template-area-stats").html());
  templates.story         = Handlebars.compile($("#template-story").html());
  templates.storyNav      = Handlebars.compile($("#template-story-nav").html());

  // use
  // var html1 = templates.storyPreviews({ title: "Story A" });
  // var html2 = templates.areaStats({ value: "12" });

}

// ----------------------------------------------
// Tree Class (uses p5)
// ----------------------------------------------

function Tree (root, branch0) {
 
  // construct

  this.id = branch0.props.id;
  this.areaCopy = areaNames[this.id];
  this.root = root;
  this.branches = [];
  this.storyCount = countChildren(branch0, 0);
  this.drawn = false;
  this.svgGroup = svg.group()
    .addClass("tree").addClass("hide")
    .attr({ "id": branch0.props.id });
  this.legendGroup = null;
 
  // methods essential to construct

  this.addBranch = function (b) {
    b.attachTo(this);
    this.branches.push(b);
  }
  
  // finish to construct
  
  this.addBranch(branch0);

  // other methods --- draw

  this.display = function () {
    if (this.drawn) {
      return;
    }
    var branchesNotDrawn = 0;
    for (var i = 0; i < this.branches.length; i++) {
      this.branches[i].branch();
      this.branches[i].display();
      if (!this.branches[i].drawn) {
        branchesNotDrawn++;
      }
    }
    if (branchesNotDrawn == 0){
      this.complete();
    }
  }

  this.complete = function () {
    
    // --- draw bg, root point, data circle and Area name

    // --- Sensible area rect
    // this.svgGroup
    //   .rect(this.svgGroup.bbox().w, this.svgGroup.bbox().h)
    //   .move(this.svgGroup.bbox().x, this.svgGroup.bbox().y)
    //   .back()
    //   .attr({ "fill": "red", "opacity": 0 });

    var circleDiameter = Math.sqrt(this.storyCount/PI) * len0 * 0.7;

    this.svgGroup
      .circle(circleDiameter)
      .cx(0).cy(0)
      .addClass("story-count")
      .back()
      .attr({ "fill": "#3EBFB9", opacity: 0.25 });

    this.svgGroup
      .circle(4).cx(0).cy(0)
      .addClass("root-point")
      .attr({ "fill": "black" });

    var gt = this.svgGroup.group().addClass("tree-label");
    var y1 = len0 * 0.55 + 5;
    gt.text(this.areaCopy).x(0).y(y1)
      .addClass("font-serif-m")
      .addClass("area-name")
      .font({ "anchor": "middle" });
    gt.text(this.storyCount + (this.storyCount == 1 ? " story" : " stories")).x(0).y(y1 + 30)
      .addClass("font-small-stories")
      .font({ "anchor": "middle" });

    this.drawn = true;
    this.rootPoint = {};
    this.rootPoint.x = this.svgGroup.bbox().x;
    this.rootPoint.y = this.svgGroup.bbox().y;
  }

  // other methods --- after drawn

  // this.rootPoint = function () {
  //   var rootBranch = this.svgGroup.findOne(".branch-area");
  //   if (!rootBranch.hasOwnProperty("_array")) {
  //     this.svgGroup.dmove(0, 0);
  //   }
  //   var origin = [rootBranch._array[0][1], rootBranch._array[0][2]];
  //   console.log(origin);
  // }

  this.moveRoot = function (x, y, animate) {
    var ms = (animate === true) ? animms : 1;
    this.svgGroup.animate(ms).move(x + this.rootPoint.x, y + this.rootPoint.y);
  }

  this.moveCenter = function (x, y, animate) {
    var ms = (animate === true) ? animms : 1;
    this.svgGroup.animate(ms).move(x - this.svgGroup.bbox().w/2, y - this.svgGroup.bbox().h/2);
  }

  this.show = function () {
    this.svgGroup.removeClass("hide");
  }

  this.hide = function () {
    this.svgGroup.addClass("hide");
  }

  this.isVisible = function () {
    return !this.svgGroup.hasClass("hide");
  }

  this.moveLeft = function (animate) {
    if (isMobile()) {
      var x = state.w / 2;
      var y = state.treePositions[Object.keys(state.treePositions)[0]].y;
      this.moveRoot(x, y, animate);
      this.svgGroup.addClass("selected");      
    } else {
      this.moveCenter(state.w*0.25, state.h * 0.42, animate);
      this.svgGroup.addClass("selected");
      this.svgGroup.findOne(".tree-label")
        .animate(animms).transform({ "translateY": len0*0.6 });
    }
  }

  this.moveInPosition = function (animate) {
    var pos = state.treePositions[this.id];
    this.moveRoot(pos.x, pos.y, animate);
    this.svgGroup.removeClass("selected");
    this.svgGroup.findOne(".tree-label")
      .animate(animms).transform({ "translateY": 0 });
  }


  this.showLegend = function () {

    // var dataCircle = this.svgGroup.findOne("circle.story-count");

    // // state and ui
    // state.currentPage = { 
    //   "type": "legend",
    //   "id": null,
    //   "depth": 0,
    // };

    // setTimeout(function() {
    //   $("body").addClass("legend");
    //   $(".legend-cta").css({ "top": dataCircle.bbox().y2 + 80 });
    // }, animms);

    this.legendGroup = this.svgGroup.group().back();


    // Draw line from cherry
    if (!isMobile()) {
      var cherryText = "Click to explore stories. Each tree shows a geography.\nBranches show sectors \nand levels.";
      var cherries = this.svgGroup.find("circle.selection-circle");
      var cherryR = _.maxBy(cherries, function(c) { return c.bbox().x });
      var cherryBB = cherryR.bbox();
      var x1 = cherryBB.x + cherryBB.w + 3;
      var y = cherryBB.y + cherryBB.h/2;
      var len = 35;
      this.legendGroup.line(x1, y, x1 + len, y)
        .attr({ "stroke": "rgba(0,0,0,0.15)" });
      this.legendGroup.text(function(add) {
        add.tspan("Click to explore stories.").addClass("font-small-bold").newLine();
        add.tspan("Each tree shows a geography.").newLine();
        add.tspan("Branches show sectors").newLine();
        add.tspan("and levels.").newLine();
      }).font({ "anchor": "start" })
        .addClass("font-small")
        .x(x1 + len + 8).y(y - 8);
    }


    // Draw circle outline
    var dataCircle = this.svgGroup.findOne("circle.story-count");
    var clone = dataCircle.clone();
    clone.attr({ 
      "fill": "none",
      "stroke": dataCircle.fill(),
      "stroke-width": 8,
      "opacity": 0,
    }).removeClass("story-count").addClass("circle-blink")
      .addTo(this.legendGroup);
      clone.radius(dataCircle.bbox().w/2 + 13).opacity(0.2);

    // texts
    if (!isMobile()) {
      this.svgGroup.findOne("g.tree-label .area-name")
        .text("Geography")
      this.svgGroup.findOne("g.tree-label .font-small-stories").opacity(0);
      this.svgGroup.findOne(".tree-label")
        .dy( -(len0 * 0.55 + 5) + 20 );
    }

    // // hide other trees
    // svg.find("g.tree:not(#"+ this.id +")").addClass("hidden");
  }

  this.removeLegend = function () {

    // state and ui
    // state.currentPage.type = null;
    // $("body").removeClass("legend");

    // remove svg elements
    this.legendGroup.remove();

    // texts
    if (!isMobile()) {
      this.svgGroup.findOne("g.tree-label .area-name")
        .text(this.areaCopy)
      this.svgGroup.findOne("g.tree-label .font-small-stories").opacity(1);
      this.svgGroup.findOne(".tree-label")
        // .animate(animms)
        .dy( - 20 + (len0 * 0.55 + 5) );
    }

    // show all trees
    // svg.find("g.tree:not(#"+ this.id +")").removeClass("hidden");

  }


  // NEED TO IMPLEMENT?
  this.selectStory = function (id) {
  }

  // BROKEN
  // BROKEN TRY FIX ?
  // BROKEN
  this.scale = function (factor, animate) { 
    var ms = (animate === true) ? animms : 1;
    this.svgGroup
      .animate(ms)
      .transform({
        translateX: -this.rootPoint.x,
        translateY: -this.rootPoint.y,
        scale: factor 
      });
  }


}

function showLegend () {

  // state and ui
  state.currentPage = { 
    "type": "legend",
    "id": null,
    "depth": 0,
  };

  var dataCircle = trees.europe.svgGroup.findOne("circle.story-count");
  setTimeout(function() {
    $("body").addClass("legend");
    $(".legend-cta").css({ "top": dataCircle.bbox().y2 + 80 });
  }, animms);

  if (isMobile()) {
    trees["north-america"].showLegend();
    trees.europe.showLegend();
    $("g.tree:not(#europe, #north-america)").addClass("hidden");
  } else {
    trees.europe.showLegend();
    // hide other trees
    $("g.tree:not(#europe)").addClass("hidden");
  }

}

function removeLegend () {

  // state and ui
  state.currentPage.type = null;
  $("body").removeClass("legend");

  if (isMobile()) {
    trees["north-america"].removeLegend();
    trees.europe.removeLegend();
  } else {
    trees.europe.removeLegend();
  }

  // show all trees
  $("g.tree").removeClass("hidden");

}


// ----------------------------------------------
// Branch Class (uses p5)
// ----------------------------------------------

function Branch (children, start, len, angle, props) {

  // construct

  this.tree = null;
  this.children = children;
  this.start = (start != null) ? start.copy() : createVector(0,0);
  this.len = len;
  this.angle = angle;
  this.props = props;
  this.curveDir = this.props.hasOwnProperty("forceCurveDir") 
    ? this.props.forceCurveDir
    : (random(1) > 0.5) ? -1 : 1;
  
  this.dir = createVector(0, 1);
  this.dir.mult(this.len);
  this.dir.rotate(this.angle);
  this.end = p5.Vector.sub(this.start, this.dir);

  this.branched = false;
  this.drawn = false;

  // methods

  this.attachTo = function (tree) {
    this.tree = tree;
  }

  this.branch = function () {
    if (!this.branched && this.children.length > 0) {

      // --- count total children

      var normAngles = [];
      var totalCount = countChildren(this);
      var normSum = 0;
      this.children.forEach(function (child) {
        var count = countChildren(child);
        var norm = count/totalCount;
        var normAngle = normSum + norm/2;
        normAngles.push(normAngle);
        normSum += norm;
      });

      // --- make branches

      for (var i = 0; i < this.children.length; i++) {
        
        // --- PARAMS
        var chNum = countChildren(this.children[i], 0);
        var dimension = this.children[i].props.dimension;
        var newLen = (dimension == "area") ? len0 * 0.2 // never happens, defined on tree creation
          : (dimension == "level") ? len0           * map(chNum, 1,25, 1, 2.5)  // level
          : (dimension == "sector") ? len0          * random(0.5, 0.8)  // sector
          : len0                                    * random(0.4, 0.6); // story
        
        // total angle --- ( PI = 180° )
        var availableAngle = (dimension == "level") 
          ? PI * 0.45 * map(this.props.totalTreeStories, 1,35, 0.8, 1.6)
          : PI * 0.55;

        var startAngle = -availableAngle/2;
        var newRelAngle = startAngle + availableAngle*normAngles[i];
        var newAngle = this.angle + newRelAngle; //randomAngle(PI/5);

        // edit props
        this.children[i].props.totalTreeStories = this.props.totalTreeStories;
        if (this.children.length == 1) {
          this.children[i].props.forceCurveDir = -this.curveDir;
        }

        var b = new Branch(
          this.children[i].children, 
          this.end.copy(), 
          newLen, 
          newAngle, 
          this.children[i].props);
        this.tree.addBranch(b);
      }
      this.branched = true;
    }
  }

  this.display = function () {
    if (this.drawn) {
      return;
    }

    // control points
    var angle = PI/15;
    var mag = 0.3;
    var v1 = p5.Vector.sub(this.end, this.start);
    var v2 = p5.Vector.sub(this.start, this.end);
    
    // var angle1 = random() > 0.5 ? angle : -angle;
    var angle1 = angle * this.curveDir;

    var angle2 = angle1 != angle ? angle : -angle;
    var p1 = v1.rotate(angle1).mult(mag).add(this.start);
    var p2 = v2.rotate(angle2).mult(mag).add(this.end);

    var path = svgBranchCurved(
      this.start.x, this.start.y, 
      p1.x,         p1.y, 
      p2.x,         p2.y, 
      this.end.x,   this.end.y,
      this.props);
    this.tree.svgGroup.add(path);

    this.drawn = true;
  }
}

// ----------------------------------------------
// Timeline Class
// ----------------------------------------------

function Timeline (x, y1, y2) {

  // construct

  this.stories = [];
  this.area = null;
  this.startDate = null;
  this.endDate = null;
  this.x = x;
  this.y1 = y1;
  this.y2 = y2;

  this.svgGroup = svg.group().addClass("timeline").addClass("hide").addClass("hide-points");
  this.svgGroup.line(this.x, this.y1, this.x, this.y2).addClass("timeline-skeleton");
  this.selection = this.svgGroup.circle(15).cx(this.x).cy(0).addClass("point-selection");
  this.date = this.svgGroup.text("")
    .addClass("point-date").addClass("font-small")
    .font({ "anchor": "end", "leading": "1.1em" })
    .x(this.x - 15).y(this.y1);

  // methods

  this.update = function (area, stories) {
    this.area = area;
    this.stories = stories;
    this.svgGroup.find(".points").remove();
    var sg = this.svgGroup.group().addClass("points");
    sg.line(this.x, this.y1, this.x, this.y2).addClass("timeline-skeleton-sensi");
    var that = this;

    // --- V1: Map on area
    // var first = moment.min(this.stories.map(function(s){ return s.date; }));
    // var last = moment.max(this.stories.map(function(s){ return s.date; }));
    
    // --- V2: Map across all areas
    var first = state.firstDate;
    var last = state.lastDate;
    var storyClick = function (event) {
      var slug = this.node.dataset.slug;
      setStatePage ("story", slug);
    }

    this.stories.forEach(function(s) {
      var y = apMap(s.date.unix(), first.unix(), last.unix(), that.y1, that.y2);

      // sg.circle(6).cx(that.x).cy(y)
      //   .addClass("point")
      //   .attr("data-slug", s.slug)
      //   .on("click", storyClick);

      var sgg = sg.group()
        .attr("data-slug", s.slug)
        .addClass("point")
        .on("click", storyClick);
      sgg.rect(20, 10).cx(that.x).cy(y)
        .attr({ "fill": "rgba(0,0,0,0)", "stroke": "none" });
      sgg.circle(6).cx(that.x).cy(y)
        .addClass("point");
    });
  }

  this.moveSelection = function (slug) {
    var point = $(".timeline g.point[data-slug='"+ slug +"']")[0].instance;
    var date = state.storiesMap[slug].date;
    var dateString = date.format("D MMM") +"\n"+ date.format("YYYY");

    point.front();
    $(".timeline g.point").removeClass("selected");
    point.addClass("selected");

    this.selection.front().animate(animms).cy(point.cy());
    this.date.text(dateString).animate(animms).y(point.cy() - 15);
  }

  this.showSelection = function () {
    this.selection.removeClass("hide");
    this.date.removeClass("hide");
  }

  this.hideSelection = function () {
    this.selection.addClass("hide");
    this.date.addClass("hide");
    $(".timeline g.point").removeClass("selected");
  }

  this.show = function () {
    this.svgGroup.removeClass("hide");
    // this.showSelection();
  }

  this.hide = function () {
    this.svgGroup.addClass("hide");
    // this.hideSelection();
  }

  this.showPoints = function () {
    this.svgGroup.removeClass("hide-points");
    this.showSelection();
  }

  this.hidePoints = function () {
    this.svgGroup.addClass("hide-points");
    this.hideSelection();
  }
}


// ----------------------------------------------
// Listeners & functions
// ----------------------------------------------

// --- Regarding interaction w/ trees and branches

function initialize () {

  state.treePositions = updateTreesPos();

  showLegend();

  Object.keys(trees).forEach(function (k) {
    // trees[k].hide();
    trees[k].moveInPosition();
  });
  setTimeout(function() {
    Object.keys(trees).forEach(function (k) {
      trees[k].show();
    });
  }, animms);

  var my = 40;
  timeline = new Timeline(state.w/2, my, state.h-my);
}


function updateTreesPos () {
  if (state.isMobile) {
    var x1 = state.w * 0.3;
    var x2 = state.w * 0.7;
    var mt = 40;
    var mb = 20;
    var y1 = mt + ((state.h - mt - mb) * 0.333) - 150; // state.h * 0.22;
    var y2 = mt + ((state.h - mt - mb) * 0.666) - 150; // state.h * 0.52;
    var y3 = mt + ((state.h - mt - mb) * 0.999) - 150; // state.h * 0.82;
    return {
      "north-america":  { "x": x1, "y": y1 },
      "europe":         { "x": x2, "y": y1 },
      "asia-oceania":   { "x": x1, "y": y2 },
      "latin-america":  { "x": x2, "y": y2 },
      "africa":         { "x": x1, "y": y3 },
    };
  } else {
    var x1 = state.w * 0.15;
    var x4 = state.w * 0.325;
    var x2 = state.w * 0.50;
    var x5 = state.w * 0.675;
    var x3 = state.w * 0.85;
    var y1 = state.h * 0.45;
    var y2 = state.h * 0.80;
    return {
      "north-america":  { "x": x1, "y": y1 },
      "europe":         { "x": x2, "y": y1 },
      "asia-oceania":   { "x": x3, "y": y1 },
      "latin-america":  { "x": x4, "y": y2 },
      "africa":         { "x": x5, "y": y2 },
    };
  }
}


function showTrees (/*animate*/) {
  Object.keys(trees).forEach(function (k) {
    if (!trees[k].isVisible()) {
      trees[k].show(/*animate*/);
    }
  });
}


function hideTrees (/*animate*/) {
  Object.keys(trees).forEach(function (k) {
    if (trees[k].isVisible()) {
      trees[k].hide(/*animate*/);
    }
  });
}


function repositionAllTrees (animate) {
  Object.keys(trees).forEach(function (k) {
    var pos = state.treePositions[k];
    trees[k].moveRoot(pos.x, pos.y, animate);
  });
}


function deselectAllBranches () {
  $(".branch-g").removeClass("selected").css("opacity", 1);
}


// ------------------------------------
// --- Pages states
// ------------------------------------

function setStatePage (type, id) {
  
  // --- manage state

  if (state.currentPage.type == "legend") {
    removeLegend();
    setTimeout(function() {
      setStatePage (type, id);
    }, 1000);
    return;
  }

  var oldPage = {
    "type":   state.currentPage.type,
    "id":     state.currentPage.id,
    "depth":  state.currentPage.depth,
  }

  if (type == "area") {
    if (oldPage.type === "area" && oldPage.id === id) {
      type = "home";
    }
  }

  var depths = { "home": 0, "area": 1, "story": 2 };
  var depth = depths[type];
  if (depth === null) {
    throw "Wrong type passed to setter: "+ type;
  }


  // --- manage body classes

  $("body").removeClass("home").removeClass("area").removeClass("story");
  $("body").addClass(type);

  

  // --- manage svg trees

  if (type == "home" && state.selectedTree !== null) {
    
    deselectAllBranches();
    selectTree(null);
  
  } else if (type == "area") {

    deselectAllBranches();
    if (!(oldPage.type === "story" && state.selectedTree === id)) {
      selectTree(id);
    }
  
  } else if (type == "story") {

    var story = state.storiesMap[id];
    console.log("story", story);

    var wait = 0;

    if (story.area !== state.selectedTree) {
      selectTree(story.area);
    }

    // --- branch and cherry

    $("g.tree#"+ story.area +" .branch-g").removeClass("selected").css("opacity", 0.1);
    $("g.tree#"+ story.area +" .branch-g.branch-story").css("opacity", 0.2);

    $(".branch-g#"+ story.area).addClass("selected");
    $(".branch-g#"+ story.area +"---"+ story.level).addClass("selected");
    $(".branch-g#"+ story.area +"---"+ story.level +"---"+ story.sector).addClass("selected");
    $(".branch-g[data-value='"+ story.slug +"']").addClass("selected");

  }



  // --- manage content

  if (type == "home") {

    $("#content-wrapper").html("");
  
  } else {

    setTimeout(function() {

      if (type == "area") {
        
        var stories = getAreaStories(state.selectedTree);
        var areaImgUrl = releaseFolder +"/maps-areas/"+ id +".svg";
        var countBy = _.countBy(stories, "sectorCopy");
        var sectors = Object.keys(countBy).map(function(sectorCopy) {
          // var circleDiameter = countBy[sectorCopy] *10;
          var circleDiameter = Math.sqrt(countBy[sectorCopy]) * len0 * 0.7 / 2;
          return { 
            "sectorCopy": sectorCopy, 
            "sector": sectorCopy.slug(), 
            "count": countBy[sectorCopy],
            "pixels": circleDiameter,
          };
        });
        var context1 = { 
          "imgSrc": areaImgUrl,
          "sectors": sectors,
        };
        var context2 = { 
          "stories": stories 
        };
        var htmlAreaStats = templates.areaStats(context1);
        var htmlStories = templates.storyPreviews(context2);
        
        $("#content-wrapper").html(htmlAreaStats).append(htmlStories);
        
      } else if (type == "story") {

        var story = state.storiesMap[id];
        var htmlStory = templates.story(story);
        $("#content-wrapper").html(htmlStory);
        
        $("#story-title-lg").html(story.titleCopy);
        var h = $("#story-title-lg").height();
        $("#story-title-lg").css({ "margin-top": -h/2 });

      }

      // --- manage sticky header I

      if (type == "area") {

        if (isMobile()) {
          sticky($("#story-previews-header"), window, function(placeholder, win) {
            // return true if it should stick
            var shouldStick = ($(win).scrollTop() - $(placeholder).position().top > 0);
            return shouldStick;
          }/*, 90*/);
        } else {
          sticky($("#story-previews-header"), $("#content-wrapper")[0], function(placeholder, contWrapper) {
            // return true if it should stick
            var shouldStick = ($(placeholder).offset().top - $("#header").height() < $(contWrapper).position().top);
            return shouldStick;
          }, $("#header").height());
        }

      }

    }, animmsSelectTree);
  }




  // --- manage sticky header II

  if (type == "home" || type == "story") {

    stickyStop(window);
    stickyStop($("#content-wrapper")[0]);

  } /*else if (type == "area") {

    if (isMobile()) {
      sticky($("#story-previews-header"), window, function(placeholder, win) {
        // return true if it should stick
        var shouldStick = ($(win).scrollTop() - $(placeholder).position().top > 0);
        return shouldStick;
      });
    } else {
      sticky($("#story-previews-header"), $("#content-wrapper")[0], function(placeholder, contWrapper) {
        // return true if it should stick
        var shouldStick = ($(placeholder).offset().top - $("#header").height() < $(contWrapper).position().top);
        return shouldStick;
      }, $("#header").height());
    }

  }*/




  
  // --- manage timeline
  
  if (!isMobile()) {
  
    if (type == "home") {

      timeline.hide();

    } else {

      setTimeout(function() {
        timeline.show();
      }, animmsSelectTree);

      var area;

      if (type == "area") {
        area = id;
      } else if (type == "story") {
        var story = state.storiesMap[id];
        area = story.area;
      }

      if (area !== timeline.area) {
        var stories = getAreaStories(area);
        console.log("stories", stories);
        timeline.update(area, stories);
      }

      if (type == "area") {
        // timeline.hidePoints();
        timeline.showPoints();
        timeline.hideSelection();
      } else if (type == "story") {
        var story = state.storiesMap[id];
        timeline.showPoints();
        timeline.moveSelection(story.slug);
      }

    }
  }



  // --- manage story nav

  if (type == "story") {

    var story = state.storiesMap[id];
    var areaStories = getAreaStories(story.area);
    var i = _.findIndex(areaStories, { "slug": story.slug });
    // var tags = story.tags.charAt(0).toUpperCase() + story.tags.slice(1);

    var context = {
      "n": i + 1,
      "total": areaStories.length,
      // "tags": tags,
      "areaCopy": story.areaCopy,
    }
    var htmlStoryNav = templates.storyNav(context);
    
    if (!isMobile()) {
      $("#ui-left .bottom").html(htmlStoryNav);
    }
  
  }
  

  // --- update state

  state.currentPage = {
    "type":   type,   // ---  home  area      story
    "id":     id,     // ---  null  "europe"  "story-slug-lorem-ipsum"
    "depth":  depth,  // ---  0     1         2
  };

}


function filterStoriesBySector(sector) {

  // // --- V1: redraw all markup

  // var stories = getAreaStories(state.selectedTree);
  // var newStories = stories.filter(function (s) {
  //   return s.sector == sector;
  // });
  // console.log(newStories)

  // // remove stories
  
  // $("#content .story-previews").remove();

  // // show new stories

  // var context = { "stories": newStories };
  // var htmlStories = templates.storyPreviews(context);
  // $("#content-wrapper").append(htmlStories);


  

  // --- V2: show/hide based on data-attribute

  var areaStories = getAreaStories(state.selectedTree);

  var scrollingEl = isMobile() ? window : $("#content-wrapper")[0];

  var currentlySelectedEl = $("#content .area-stats .stat-wrapper.selected")[0];
  var currentlySelected = currentlySelectedEl ? currentlySelectedEl.dataset.sector : null;

  if (sector !== null && sector !== currentlySelected) {

    // hide all + show
    $("#content .story-previews .story-preview").hide();
    $("#content .story-previews .story-preview[data-sector='"+ sector +"']").show();
    
    // update buttons
    $("#content .area-stats .stat-wrapper")
      .removeClass("selected").addClass("deselected");
    $("#content .area-stats .stat-wrapper[data-sector='"+ sector +"']")
      .removeClass("deselected").addClass("selected");
  
    // update header
    var c = _.countBy(areaStories, "sector");
    $("#content .story-previews .story-count").html(c[sector]);
  
    // UI reacts
    $(".area-stats .area-map").slideUp(400);
    // scrollingEl.animate({ "scrollTop": 0 }, animms);
  
  } else {

    // show all
    $("#content .story-previews .story-preview").show();
    
    // update buttons
    $("#content .area-stats .stat-wrapper")
      .removeClass("selected").removeClass("deselected");

    // update header
    $("#content .story-previews .story-count").html(areaStories.length);
  
    // UI reacts
    $(".area-stats .area-map").slideDown(400);
    console.log(scrollingEl)
    $(scrollingEl).animate({ "scrollTop": 0 }, animms );
  }


}



// sticky header

function stickyStop (scrollingEl) {
  $(scrollingEl).off("scroll");
}
function sticky (stickEl, scrollingEl, shouldStick, stickTopValue) {
  var top = stickTopValue || 0;
  var from = $("<a id='stiky-placeholder'></a>");
  from.insertBefore($(stickEl));
  $(scrollingEl).scroll(function() {
    var stick = shouldStick($("#stiky-placeholder")[0], scrollingEl);
    if (stick) {
      if (!$(stickEl).hasClass("stick")) {
        $("#stiky-placeholder").addClass("stick");
        $(stickEl).addClass("stick");
        $(stickEl).css({ 
          "position": "fixed", 
          "top": top,
          // "width": "100%",
        });
      }
    } else {
      if ($(stickEl).hasClass("stick")) {
        $("#stiky-placeholder").removeClass("stick");
        $(stickEl).removeClass("stick");
        $(stickEl).css({ 
          "position": "relative", 
          "top": "0", 
        });
      }
    }
  });
}


// these two could be written better

function openNextStory () {
  if (state.currentPage.type !== "story") {
    throw "No open story";
    return;
  }
  var slug = state.currentPage.id;
  var story = state.storiesMap[slug];
  var stories = getAreaStories(story.area);
  var currentIndex = _.findIndex(stories, { "slug": slug });
  var newIndex = currentIndex + 1;
  if (newIndex >= stories.length) {
    newIndex = 0;
  }
  var newSlug = stories[newIndex].slug;
  setStatePage("story", newSlug);
}
function openPrevStory () {
  if (state.currentPage.type !== "story") {
    throw "No open story";
    return;
  }
  var slug = state.currentPage.id;
  var story = state.storiesMap[slug];
  var stories = getAreaStories(story.area);
  var currentIndex = _.findIndex(stories, { "slug": slug });
  var newIndex = currentIndex - 1;
  if (newIndex < 0) {
    newIndex = stories.length - 1;
  }
  var newSlug = stories[newIndex].slug;
  setStatePage("story", newSlug);
}


function selectTree (id) {

  // deselect

  if (id === null) {
    if (state.selectedTree !== null) {
      var oldId = state.selectedTree;
      trees[oldId].moveInPosition(true);
      setTimeout(function() { showTrees(); }, animms/2);
      state.selectedTree = null;
    }
    updateHeader();
    return;
  }

  if (state.selectedTree !== null) {

    // swap selection

    var oldId = state.selectedTree;
    state.selectedTree = id;
    trees[oldId].hide();
    trees[oldId].svgGroup.removeClass("selected"); // hack
    setTimeout(function() { 
      trees[oldId].moveInPosition(); 
      trees[state.selectedTree].moveLeft();
    }, animms);
    setTimeout(function() { 
      trees[state.selectedTree].show();
    }, animms*2);
  
  } else {
    
    // all > select one

    state.selectedTree = id;
    trees[state.selectedTree].moveLeft(true); 
    hideTrees();
    setTimeout(function() { 
      trees[state.selectedTree].show();
    }, animms*2);
  }

  // toggleBelow(false);
  updateHeader();
}


function updateHeader () {
  $("#header")
    .removeClass("europe")
    .removeClass("north-america")
    .removeClass("asia-oceania")
    .removeClass("latin-america")
    .removeClass("africa");
  if (state.selectedTree){
    $("#header").addClass(state.selectedTree);
  }
}


// --- Listeners and events

function addListeners () {

  $("svg g.tree .branch-g.branch-story").mouseover(function(e){     
    var area = this.id.split("---")[0];
    var level = this.id.split("---")[1];
    var sector = this.id.split("---")[2];
    if (area == state.selectedTree && state.currentPage.type == "story") {
      $(".branch-g#"+ area).addClass("hovered");
      $(".branch-g#"+ area +"---"+ level).addClass("hovered");
      $(".branch-g#"+ area +"---"+ level +"---"+ sector).addClass("hovered");
      $(this).addClass("hovered");
    }
    var c = this.instance.findOne("circle");
    tooltip (c.cx(), c.cy() - 40, this.dataset.title);
  });

  $("svg g.tree .branch-g.branch-story").mouseout(function(e){ 
    var area = this.id.split("---")[0];
    var level = this.id.split("---")[1];
    var sector = this.id.split("---")[2];
    if (area == state.selectedTree && state.currentPage.type == "story") {
      $(".branch-g#"+ area).removeClass("hovered");
      $(".branch-g#"+ area +"---"+ level).removeClass("hovered");
      $(".branch-g#"+ area +"---"+ level +"---"+ sector).removeClass("hovered");
      $(this).removeClass("hovered");
    }
    tooltipOff();
  });

  $("svg .branch-story").click(function(e){ 
    e.stopPropagation();
    // handleStoryClick(this.dataset.value);
    var slug = this.dataset.value;
    setStatePage("story", slug);
  });

  $("svg g.tree").click(function(e){ 
    if (state.currentPage.type == "legend") {
      removeLegend();
      return;
    }
    setStatePage("area", this.id);
  });

  $("#header .item").click(function(e) {
    console.log(e)
    var target = (e.target.tagName == "SPAN") ? e.target.parentNode : e.target;
    handleMenuClick(target.dataset.type, target.dataset.value);
  });

  $("#header .logo").click(function(e) {
    // setStatePage("home", null);
    // window.location.reload();
    window.location = window.location.href.split("?")[0];
  });

  $("#to-top").click(function() {
    $("html, body").animate({ "scrollTop": 0 }, animms);
  });

  $("#nav-back").click(function() {
    if (state.currentPage.type == "story") {
      setStatePage("area", state.selectedTree);
    } else if (state.currentPage.type == "area") {
      setStatePage("home", null);
    }
  });

  $(window).resize(function() {
    // if (cnt.offsetWidth != state.w){
    //   svg.find("*").remove();
    //   $("#content *").remove();
    //   $("#story-title-lg").html("");
    //   svg.text("Window width has changed, reloading.")
    //     .addClass("font-serif-m").addClass("cursor-pointer")
    //     .x(cnt.offsetWidth / 2).y(cnt.offsetHeight / 2)
    //     .font({ "anchor": "middle" })
    //     .click(function() {
    //       window.location.reload();
    //     });
    //   // setTimeout(function() { window.location.reload(); }, 500);
    // }

    if (cnt.offsetWidth != state.w){
      $("#container *").remove();
      $("body").addClass("will-reload");
      setTimeout(function() { window.location.reload(); }, 700);
    }


  });

  $(document).keydown(function(e) {
    switch(e.which) {
      case 37: // left
      case 38: // up
      if (state.currentPage.type == "story") {
        openPrevStory();
        e.preventDefault();
      }
      break;
      case 39: // right
      case 40: // down
      if (state.currentPage.type == "story") {
        openNextStory();
        e.preventDefault();
      }
      break;
      default: return; // exit this handler for other keys
    }
  });

}


function handleMenuClick (type, value) {

  if (type == "area") {

    setStatePage("area", value);

  } else if (type == "anchor") {

    var wait = 0;
    if (state.selectedTree !== null) {
      wait = animms;
    }
    setStatePage("home", null);
    setTimeout(function() {
      var to = $("#"+ value).offset().top;
      $("html, body").animate({ "scrollTop": to }, animms);
    }, wait);
  }
}


// --- Utilities

function getAreaStories (area) {
  var stories = Object.keys(state.storiesMap)
    .map(function(k) { 
      return state.storiesMap[k]; 
    })
    .filter(function(story) {
      return story.area == area;
    });
  return _.sortBy(stories, function(s) { return s.date.unix(); });
}


function countChildren (item, sum) {
  currentSum = sum ? sum : 0;
  if (item.children.length == 0) return 1;
  var newSum = 0;
  item.children.forEach(function(c) {
    newSum += countChildren(c, currentSum);
  });
  return newSum + currentSum;
}


function isMobile () {
  var mql = window.matchMedia('(max-width: 991px)');
  return mql.matches;
}


function loadData (file, callback) {
  var middata = {};
  $.getJSON( file, function(jsonData) {

    // state.flatData = jsonData;

    // --- mid data structure
    
    var sortedJsonData = _.sortBy(jsonData, function(d) { return moment(d.date).unix(); });

    for (var i = 0; i < sortedJsonData.length; i++) {
      var d = sortedJsonData[i];
      var area = d.area.slug();
      var level = d.level.slug();
      var sector = d.sector.slug();
      if (!middata.hasOwnProperty(area)) {
        middata[area] = {};
      }
      if (!middata[area].hasOwnProperty(level)) {
        middata[area][level] = {};
      }
      if (!middata[area][level].hasOwnProperty(sector)) {
        middata[area][level][sector] = [];
      }
      middata[area][level][sector].push(d);
    }
    console.log("middata", middata);

    // --- full tree data structure

    fullTreeData = {
      "children": [],
      "props": {
        "id": "data-root",
        "depth": 0,
      }
    };
    var areas = Object.keys(middata);
    for (var i = 0; i < areas.length; i++) {
      var area = areas[i];
      var areaChildrenArray = [];
      fullTreeData.children.push({
        "children": areaChildrenArray,
        "props": {
          "id": area,
          "depth": 1,
          "dimension": "area",
          "value": area,
          "class": "branch-area"
        }
      });
      var levels = Object.keys(middata[area]);
      for (var j = 0; j < levels.length; j++) {
        var level = levels[j];
        var levelChildrenArray = [];
        areaChildrenArray.push({
          "children": levelChildrenArray,
          "props": {
            "id": area +"---"+ level,
            "depth": 2,
            "dimension": "level",
            "value": level,
            "class": "branch-level"
          }
        });
        var sectors = Object.keys(middata[area][level]);
        for (var k = 0; k < sectors.length; k++) {
          var sector = sectors[k];
          var sectorChildrenArray = middata[area][level][sector].map(function (d, di) {
            var storySlug = d.title.slug();
            var storyDate = moment(d.date);

            var stats = d["stats"].trim();
            var percentage = /%$/.test(stats); // ends with %

            var story = {
              "id":           d["id"],
              "areaCopy":     d["area"],
              "levelCopy":    d["level"],
              "sectorCopy":   d["sector"],
              "locationText": d["location-text"],
              "quoteText":    d["quote-text"],
              "quoteAuthor":  d["quote-author"],
              "stats":        d["stats"],
              "statsComment": d["stats-comment"],
              "source":       d["source"],
              "url":          d["url"],
              "category":     d["category"],
              "tags":         d["tags"],
              "titleCopy":    d["title"],
              "textCopy":     d["text"],

              "percentage":   percentage,
              "date":         storyDate,
              "area":         area,
              "level":        level,
              "sector":       sector,
              "slug":         storySlug,
              "dateCopy":     storyDate.format("D MMM YYYY"),

              
              "imgUrl":     releaseFolder +"/maps-stories/"+ d.id +".svg",
              // "imgUrl":     releaseFolder +"/maps-stories/"+ [
              //   "1.svg",
              //   "maps-02.svg", "maps-03.svg", "maps-04.svg", "maps-05.svg", 
              //   "maps-06.svg", "maps-07.svg", "maps-08.svg", "maps-09.svg", 
              //   "maps-10.svg", "maps-11.svg", "maps-12.svg"
              // ][Math.floor(Math.random() * 12)],

            };
            state.storiesMap[storySlug] = story;

            if (storyDate.isAfter(state.lastDate)) {
              state.lastDate = storyDate;
            }
            if (storyDate.isBefore(state.firstDate)) {
              state.firstDate = storyDate;
            }
            delete d.text;
            var props = $.extend({}, d, {
              "id": area +"---"+ level +"---"+ sector +"---"+ di,
              "depth": 4,
              "dimension": "story",
              "value": storySlug,
              "class": "branch-story",
            });
            return {
              "children": [],
              "props": props
            };
          });
          levelChildrenArray.push({
            "children": sectorChildrenArray,
            "props": {
              "id": area +"---"+ level +"---"+ sector,
              "depth": 3,
              "dimension": "sector",
              "value": sector,
              "class": "branch-sector"
            }
          });
        }
      }
    }

    callback(fullTreeData);
  }); 
}
